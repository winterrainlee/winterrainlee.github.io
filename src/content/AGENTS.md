---
created: 2026-04-29
updated: 2026-04-29
---

# Content Context

This directory contains Astro content collections for the public blog.

## Collections

- `articles/`: longer essays, analysis, and more structured writing.
- `memo/`: short notes, everyday reflections, and lightweight thoughts.
- `self-practice/`: practice logs, experiments, AI/agentic/automation learning notes.
- `pages/`: fixed pages such as the about page.
- `site/`: site-level introduction text used by layouts and index pages.

## Writing Entry Frontmatter

For `articles`, `memo`, and `self-practice`, follow the existing content schema:

```yaml
---
title: 글 제목
description: 짧은 설명
date: YYYY-MM-DD
tags:
  - tag
draft: false
---
```

- `title` and `date` are required by the schema.
- `description`, `updated`, `thumbnail`, `tags`, and `draft` are optional by schema, but `description` and `tags` are preferred for published writing entries.
- `draft` defaults to `false`. Do not leave an entry as `draft: true` when the user has approved publication.
- Keep tags short and reusable.
- Preserve the user's Korean prose style unless the user explicitly asks for editing.
- Do not automatically edit body text. For `memo` and `self-practice`, spelling checks are optional and usually unnecessary. For `articles`, suggest a spelling check before publication.

## File Names And URLs

Markdown file names become public URL slugs. Use English kebab-case file names for published writing entries.

- Keep Korean titles in frontmatter `title`.
- If a draft file name is Korean, choose an appropriate English kebab-case file name before publishing.
- Prefer lowercase letters, numbers, and hyphens.
- Keep slugs short and stable, usually 2-5 meaningful words.
- Check for existing file/slug conflicts before creating a new entry.

## Publishing Safety

- Do not publish private drafts, secrets, tokens, operational runbooks, admin paths, or private Discord details.
- When converting drafts into this directory, follow the private blog-agent runbook if available.
- Validate public content changes with `npm run build`.
