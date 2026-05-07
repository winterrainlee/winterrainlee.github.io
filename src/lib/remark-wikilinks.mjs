import { existsSync, readdirSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const CONTENT_ROOT = join(process.cwd(), 'src', 'content');
const SECTIONS = ['memo', 'articles', 'self-practice'];
const SUPPORTED_CALLOUTS = new Set(['note', 'info', 'tip', 'warning', 'danger', 'quote']);
const CALLOUT_PATTERN = /^\[!([a-z]+)\][+-]?[ \t]*(.*?)(?:\r?\n|$)/i;
const OBSIDIAN_COMMENT_PATTERN = /%%[\s\S]*?%%/g;
const WIKILINK_PATTERN = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g;

function withoutExtension(path) {
  return path.slice(0, -extname(path).length);
}

function routeFor(section, filePath) {
  const slug = withoutExtension(relative(join(CONTENT_ROOT, section), filePath))
    .split(sep)
    .join('/');

  return `/${section}/${slug.replace(/\/index$/, '')}/`;
}

function walkMarkdownFiles(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(path);
    if (entry.isFile() && ['.md', '.mdx'].includes(extname(entry.name))) return [path];
    return [];
  });
}

function addAlias(index, key, href) {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\//, '').replace(/\.(md|mdx)$/i, '');
  if (!normalizedKey) return;

  const existing = index.get(normalizedKey);
  if (!existing) {
    index.set(normalizedKey, href);
    return;
  }

  if (existing !== href) index.set(normalizedKey, null);
}

function buildWikiLinkIndex() {
  const index = new Map();

  for (const section of SECTIONS) {
    for (const filePath of walkMarkdownFiles(join(CONTENT_ROOT, section))) {
      const slug = withoutExtension(relative(join(CONTENT_ROOT, section), filePath))
        .split(sep)
        .join('/');
      const href = routeFor(section, filePath);
      const basename = slug.split('/').at(-1);

      addAlias(index, `${section}/${slug}`, href);
      addAlias(index, slug, href);
      addAlias(index, basename, href);
    }
  }

  return index;
}

function wikiLinkNodes(value, index) {
  const nodes = [];
  let lastIndex = 0;

  for (const match of value.matchAll(WIKILINK_PATTERN)) {
    const [raw, target, label] = match;
    const matchIndex = match.index ?? 0;
    const href = index.get(target.trim().replace(/\\/g, '/'));

    if (!href) continue;

    if (matchIndex > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, matchIndex) });
    }

    nodes.push({
      type: 'link',
      url: href,
      title: null,
      children: [{ type: 'text', value: (label ?? target).trim() }],
    });

    lastIndex = matchIndex + raw.length;
  }

  if (nodes.length === 0) return null;
  if (lastIndex < value.length) nodes.push({ type: 'text', value: value.slice(lastIndex) });

  return nodes;
}

function isEmptyNode(node) {
  if (node.type === 'text') return node.value.length === 0;
  if (!Array.isArray(node.children)) return false;

  return node.children.length === 0 && ['paragraph', 'heading', 'blockquote', 'list', 'listItem'].includes(node.type);
}

function removeObsidianComments(node) {
  if (!node) return;

  if (node.type === 'text') {
    node.value = node.value.replace(OBSIDIAN_COMMENT_PATTERN, '');
    return;
  }

  if (!Array.isArray(node.children)) return;

  for (let i = node.children.length - 1; i >= 0; i -= 1) {
    const child = node.children[i];

    removeObsidianComments(child);

    if (isEmptyNode(child)) {
      node.children.splice(i, 1);
    }
  }
}

function setHProperties(node, hProperties) {
  node.data = node.data ?? {};
  node.data.hProperties = {
    ...(node.data.hProperties ?? {}),
    ...hProperties,
  };
}

function firstTextChild(node) {
  if (!node || !Array.isArray(node.children)) return null;
  return node.children.find((child) => child.type === 'text') ?? null;
}

function splitCalloutTitleAndBody(firstParagraph, markerNode, title, body) {
  const markerIndex = firstParagraph.children.indexOf(markerNode);
  const bodyChildren = [];

  if (body) bodyChildren.push({ type: 'text', value: body });
  if (markerIndex >= 0) bodyChildren.push(...firstParagraph.children.slice(markerIndex + 1));

  firstParagraph.children = [{ type: 'text', value: title }];
  setHProperties(firstParagraph, { className: ['callout-title'] });

  if (bodyChildren.length === 0) return null;

  return {
    type: 'paragraph',
    children: bodyChildren,
  };
}

function transformObsidianCallouts(node) {
  if (!node || !Array.isArray(node.children)) return;

  for (const child of node.children) {
    if (child.type === 'blockquote') {
      const firstParagraph = child.children?.[0];
      const markerNode = firstParagraph?.type === 'paragraph' ? firstTextChild(firstParagraph) : null;
      const match = markerNode?.value.match(CALLOUT_PATTERN);
      const calloutType = match?.[1]?.toLowerCase();

      if (SUPPORTED_CALLOUTS.has(calloutType)) {
        const title = match[2].trim();
        const body = markerNode.value.slice(match[0].length);

        setHProperties(child, {
          className: ['callout', `callout-${calloutType}`],
          'data-callout': calloutType,
        });

        if (title) {
          const bodyParagraph = splitCalloutTitleAndBody(firstParagraph, markerNode, title, body);
          if (bodyParagraph) child.children.splice(1, 0, bodyParagraph);
        } else {
          markerNode.value = body;
          if (isEmptyNode(firstParagraph)) child.children.shift();
        }
      }
    }

    transformObsidianCallouts(child);
  }
}

function visit(node, index) {
  if (!node || !Array.isArray(node.children)) return;

  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];

    if (child.type === 'text') {
      const replacement = wikiLinkNodes(child.value, index);
      if (replacement) {
        node.children.splice(i, 1, ...replacement);
        i += replacement.length - 1;
      }
      continue;
    }

    if (!['link', 'linkReference', 'definition'].includes(child.type)) {
      visit(child, index);
    }
  }
}

export default function remarkWikiLinks() {
  const index = buildWikiLinkIndex();

  return (tree) => {
    removeObsidianComments(tree);
    transformObsidianCallouts(tree);
    visit(tree, index);
  };
}
