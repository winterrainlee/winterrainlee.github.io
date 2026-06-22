---
created: 2026-04-26
updated: 2026-06-18
---

# 겨울비 블로그 운영 가이드

이 문서는 블로그를 운영할 때 보는 안내서다. 글을 어떻게 쓰고 Markdown을 어떻게 쓰는지는 별도 문서에 정리했다.

```text
docs/writing-guide.md
```

이 블로그는 관리자 화면에서 저장 버튼을 누르는 방식이 아니다. Markdown 파일을 만들고 GitHub에 올리면, GitHub Actions가 사이트를 다시 빌드해서 GitHub Pages에 배포한다.

## 운영 흐름

```text
글 파일 작성 또는 수정
  -> 로컬에서 확인
  -> Git commit
  -> GitHub push
  -> GitHub Actions 자동 빌드
  -> GitHub Pages 배포
```

블로그 주소:

```text
https://winterrainlee.github.io/
```

저장소:

```text
https://github.com/winterrainlee/winterrainlee.github.io
```

## 자주 보는 문서

- `docs/writing-guide.md`: 새 글 쓰기, Markdown 문법, Obsidian식 링크와 주석
- `docs/templates-guide.md`: 글 템플릿 사용법
- `docs/remote-writing-guide.md`: 다른 기기에서 글 쓰는 방법
- `docs/tech_stack.md`: 블로그 기술 스택
- `docs/security_guide.md`: 공개해도 되는 문서와 숨겨야 하는 정보 기준

## 글 카테고리

### Memo

짧게 남긴 단상이다. 지나가는 마음, 문장, 장면을 가볍게 붙잡아두는 공간이다.

```text
src/content/memo/
```

URL 예시:

```text
https://winterrainlee.github.io/memo/first-note/
```

### Article

생각을 한 번 더 정리해서 쓴 글이다. memo보다 길고, 공개 글의 형태를 더 갖춘 글을 둔다.

```text
src/content/articles/
```

URL 예시:

```text
https://winterrainlee.github.io/articles/article-intro/
```

### Self-Practice

직접 이것저것 연습하며 남기는 기록이다. AI agent, automation, 블로그 제작 과정처럼 "해봤고, 배웠고, 다음에 다시 볼 만한 것"을 둔다.

```text
src/content/self-practice/
```

URL 예시:

```text
https://winterrainlee.github.io/self-practice/hello-blog/
```

## 새 글 공개하기

글 파일은 각 카테고리 폴더 아래에 Markdown으로 만든다.

```text
src/content/memo/YYYY-MM-DD-short-title.md
src/content/articles/YYYY-MM-DD-topic.md
src/content/self-practice/YYYY-MM-DD-thing-i-tried.md
```

기본 frontmatter 예시:

```yaml
---
title: 글 제목
description: 목록과 검색에 보이는 짧은 설명
date: 2026-04-27
tags:
  - blog
draft: false
---
```

- `title`: 글 제목. 필수.
- `description`: 홈, 목록, Timeline, RSS에 보이는 요약. 권장.
- `date`: 글 날짜. 필수.
- `updated`: 수정일. 필요할 때만 사용.
- `tags`: 태그 목록. 없으면 `[]` 또는 생략 가능.
- `draft`: `true`이면 공개 목록에서 숨긴다.

## 소개와 표지 문구 수정하기

소개 페이지와 각 표지 페이지의 안내 문구는 HTML 파일을 직접 고치지 않고 Markdown 파일에서 관리한다.

### 소개 페이지

소개 페이지 본문은 아래 파일에서 수정한다.

```text
src/content/pages/about.md
```

frontmatter의 `title`은 브라우저 제목에 쓰이고, `description`은 meta description에 쓰인다.

```yaml
---
title: 소개
description: 겨울비 소개
---
```

그 아래 본문은 일반 Markdown으로 쓴다.

```md
# _겨울비冬雨_

공존과 꾸준함을 연습하고 싶어 블로그를 해본다.

## Favorites

- 좋아하는 것
```

소개 페이지에서 복잡한 HTML을 직접 만질 필요는 없다. 다만 `dl`, `dt`, `dd`처럼 Markdown만으로 표현하기 애매한 구조가 필요하면 `about.md` 안에 짧은 HTML을 섞어 쓸 수 있다.

### 메인과 표지 문구

메인 화면, Memo, Article, Self-Practice, Timeline, Guestbook 표지의 짧은 소개 문구는 아래 파일에서 수정한다.

```text
src/content/site/introductions.md
```

예시:

```yaml
---
home:
  description: |-
    흘려보내기 아쉬운 단상은 memo에 둡니다.
memo:
  description: 짧게 남긴 단상
  intro: 지나가는 마음, 문장, 장면을 짧게 붙잡아 둔 단상입니다.
articles:
  description: 생각을 정리해서 쓴 글
  intro: 여러 사안에 대한 생각을 정리해서 쓴 글입니다.
---
```

- `description`: 브라우저와 검색 엔진용 설명에 쓰인다.
- `intro`: 페이지 상단에 보이는 안내 문구에 쓰인다.
- 여러 줄 문구는 `|-`를 쓰고 다음 줄부터 들여써서 적는다.

문구를 바꾼 뒤에는 빌드를 한 번 확인한다.

```bash
npm run build
```

## 로컬에서 확인하기

로컬 미리보기:

```bash
npm run dev -- --host 127.0.0.1
```

기본 빌드 확인:

```bash
npm run build
```

`npm run build`는 Astro 정적 빌드와 Pagefind 검색 인덱스 생성을 함께 확인한다. 이 명령이 실패하면 GitHub Actions 배포도 실패할 가능성이 크다.

## 배포하기

변경 내용을 확인한다.

```bash
git status --short
```

문제가 없으면 커밋하고 푸시한다.

```bash
git add .
git commit -m "Add ..."
git push
```

푸시 후 GitHub Actions가 자동으로 사이트를 빌드하고 GitHub Pages에 배포한다.

## Timeline 관리

Timeline은 별도로 글을 쓰는 곳이 아니다. `memo`, `articles`, `self-practice`에 있는 모든 글을 날짜순으로 모아 보여준다.

Timeline 순서를 바꾸고 싶으면 각 글의 `date`를 조정한다.

## 검색 관리

검색은 빌드할 때 Pagefind가 `dist/`를 읽어서 만든다. 글을 추가하거나 수정한 뒤 `npm run build`가 성공하면 검색 인덱스도 함께 갱신된다.

검색 결과 문구는 각 글의 `title`, `description`, 본문에서 나온다. 검색에 더 잘 보이게 하고 싶으면 `description`을 짧고 구체적으로 쓴다.

## 카테고리 추가하기

카테고리를 새로 만들 때는 글 폴더, content collection, 목록 페이지, 상세 페이지, 네비게이션을 함께 추가해야 한다.

예를 들어 `reading` 카테고리를 추가한다면:

```text
src/content/reading/
src/pages/reading/index.astro
src/pages/reading/[...slug].astro
```

`src/content.config.ts`에 컬렉션을 등록한다.

```ts
export const collections = {
  articles: writing('./src/content/articles'),
  memo: writing('./src/content/memo'),
  'self-practice': writing('./src/content/self-practice'),
  reading: writing('./src/content/reading'),
};
```

`src/lib/content.ts`의 `Section`, `sectionLabels`, `sectionPaths`에도 추가한다.

`src/components/Header.astro`의 `postItems`에 네비게이션 항목을 추가한다.

```ts
const postItems = [
  { href: '/memo/', label: 'MEMO' },
  { href: '/self-practice/', label: 'Self Practice' },
  { href: '/articles/', label: 'Article' },
  { href: '/reading/', label: 'Reading' },
];
```

## 조심할 점

- `src/content/...` 아래의 글 파일을 지우면 배포 후 글도 사라진다.
- 파일 이름을 바꾸면 URL도 바뀐다.
- `date`가 미래 날짜여도 현재는 숨기지 않는다.
- `dist/`, `node_modules/`, `.env`, `docs/private/`, `supabase/.temp/`는 커밋하지 않는다.
- Supabase service role key, webhook URL, Web3Forms access key, 관리자 비밀번호 같은 운영 값은 공개 문서나 브라우저 코드에 직접 넣지 않는다.

## 자주 생기는 문제

### 글이 목록에 안 보인다

- `draft: true`인지 확인한다.
- 글 파일이 올바른 폴더에 있는지 확인한다.
- frontmatter의 `date` 형식이 잘못되지 않았는지 확인한다.

### 배포가 안 된다

먼저 로컬에서 확인한다.

```bash
npm run build
```

로컬 빌드가 실패하면 터미널 에러 메시지의 파일 경로와 줄 번호를 확인한다.

### 문구를 바꿨는데 화면이 그대로다

- 소개 페이지 본문은 `src/content/pages/about.md`를 수정했는지 확인한다.
- 메인과 표지 문구는 `src/content/site/introductions.md`를 수정했는지 확인한다.
- 로컬 서버를 켜둔 상태라면 브라우저를 새로고침한다.
- 배포 사이트라면 GitHub Actions 배포가 끝났는지 확인한다.

## 운영 원칙

- 먼저 Markdown 파일로 콘텐츠를 관리한다.
- HTML/Astro 파일은 구조나 기능을 바꿀 때만 수정한다.
- 변경 후에는 `npm run build`로 확인한다.
- 커밋 전에는 `git status --short`로 의도치 않은 파일이 포함되지 않았는지 확인한다.
