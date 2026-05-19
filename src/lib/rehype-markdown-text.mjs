const HIGHLIGHT_PATTERN = /==([^=\n](?:.*?[^=\n])?)==/g;

function highlightedTextNodes(value) {
  const nodes = [];
  let lastIndex = 0;

  for (const match of value.matchAll(HIGHLIGHT_PATTERN)) {
    const [raw, content] = match;
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      nodes.push({ type: 'text', value: value.slice(lastIndex, matchIndex) });
    }

    nodes.push({
      type: 'element',
      tagName: 'mark',
      properties: {},
      children: [{ type: 'text', value: content }],
    });

    lastIndex = matchIndex + raw.length;
  }

  if (nodes.length === 0) return null;
  if (lastIndex < value.length) nodes.push({ type: 'text', value: value.slice(lastIndex) });

  return nodes;
}

function sourceForNode(node, file) {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;

  if (typeof start !== 'number' || typeof end !== 'number') return null;

  return String(file).slice(start, end);
}

function visit(node, file) {
  if (!node || !Array.isArray(node.children)) return;

  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];

    if (child.type === 'text') {
      const replacement = highlightedTextNodes(child.value);

      if (replacement) {
        node.children.splice(i, 1, ...replacement);
        i += replacement.length - 1;
      }

      continue;
    }

    if (child.type === 'element' && child.tagName === 'del') {
      const source = sourceForNode(child, file);

      if (source?.startsWith('~') && !source.startsWith('~~')) {
        node.children.splice(i, 1, { type: 'text', value: source });
        continue;
      }
    }

    visit(child, file);
  }
}

export default function rehypeMarkdownText() {
  return (tree, file) => {
    visit(tree, file);
  };
}
