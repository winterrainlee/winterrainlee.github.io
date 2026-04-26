# 겨울비 블로그 운영 가이드

작성일: 2026-04-26

이 블로그는 네이버 블로그, 티스토리, 브런치처럼 관리자 화면에서 글을 쓰는 방식이 아니다. 글 파일을 직접 만들고, GitHub에 올리면 GitHub Actions가 사이트를 다시 빌드해서 GitHub Pages에 배포하는 정적 블로그다.

처음에는 낯설 수 있지만 장점도 분명하다. 글과 블로그 구조가 모두 내 저장소에 남고, 플랫폼의 에디터나 정책에 덜 묶이며, 필요하면 디자인과 기능을 직접 바꿀 수 있다.

## 운영 방식 한눈에 보기

```text
Markdown 글 작성
  -> 로컬에서 미리보기
  -> Git commit
  -> GitHub push
  -> GitHub Actions 자동 빌드
  -> GitHub Pages 배포
```

블로그 주소:

https://winterrainlee.github.io/

저장소:

https://github.com/winterrainlee/winterrainlee.github.io

## 글 카테고리

### Memo

짧게 남긴 단상이다. 완성된 글이라기보다 지나가는 마음, 문장, 장면을 붙잡아두는 공간이다.

파일 위치:

```text
src/content/memo/
```

URL 예시:

```text
https://winterrainlee.github.io/memo/first-note/
```

### Article

여러 사안에 대한 생각을 정리해서 쓴 글이다. memo보다 길고, 생각의 흐름을 한 번 더 다듬은 글을 둔다.

파일 위치:

```text
src/content/articles/
```

URL 예시:

```text
https://winterrainlee.github.io/articles/hello-blog/
```

### Self-Practice

직접 이것저것 연습하며 남기는 기록이다. 예를 들어 AI agent, automation, 이 블로그 제작 과정처럼 “해봤고, 배웠고, 다음에 다시 볼 만한 것”을 둔다.

파일 위치:

```text
src/content/self-practice/
```

URL 예시:

```text
https://winterrainlee.github.io/self-practice/hello-blog/
```

## 새 글 쓰는 방법

1. 쓸 카테고리를 고른다.
2. 해당 폴더에 `.md` 파일을 만든다.
3. 파일 맨 위에 frontmatter를 쓴다.
4. 그 아래에 본문을 Markdown으로 쓴다.
5. 로컬에서 확인한다.
6. commit 후 push한다.

예를 들어 새 memo를 쓰려면:

```text
src/content/memo/2026-04-26-rainy-evening.md
```

파일 내용 예시:

```md
---
title: "비 오는 저녁"
description: "문득 오래 남은 저녁의 감각"
date: 2026-04-26
tags: ["daily", "rain"]
---

비가 오면 창밖이 조금 더 조용해진다.

오늘은 해야 할 말보다 남겨둘 문장이 먼저 떠올랐다.
```

## Frontmatter 규칙

모든 글 파일은 맨 위에 `---`로 감싼 정보 영역이 필요하다.

```md
---
title: "글 제목"
description: "목록과 검색에 보일 짧은 설명"
date: 2026-04-26
tags: ["tag1", "tag2"]
draft: false
---
```

자주 쓰는 항목:

- `title`: 글 제목. 필수.
- `description`: 홈, 목록, Timeline, RSS에 보이는 요약. 권장.
- `date`: 작성일. 필수. `YYYY-MM-DD` 형식 권장.
- `tags`: 태그 목록. 없으면 `[]`로 두거나 생략 가능.
- `draft`: `true`로 두면 배포 목록에서 제외된다.

초안으로 숨기고 싶을 때:

```md
draft: true
```

## 파일 이름 규칙

파일 이름은 URL이 된다. 한글도 가능하지만, 관리와 공유를 생각하면 영어 소문자와 하이픈을 권장한다.

권장:

```text
2026-04-26-rainy-evening.md
my-first-agent-note.md
why-i-keep-writing.md
```

비권장:

```text
새 글.md
최종진짜최종.md
memo 1.md
```

## Markdown 기본 사용법

제목:

```md
## 작은 제목
### 더 작은 제목
```

목록:

```md
- 첫 번째
- 두 번째
- 세 번째
```

링크:

```md
[GitHub](https://github.com/winterrainlee)
```

인용:

```md
> 오래 남는 문장은 대개 늦게 이해된다.
```

코드:

````md
```js
console.log("hello");
```
````

## 로컬에서 확인하기

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 보통 아래 주소를 연다.

```text
http://localhost:4321/
```

정식 빌드 확인:

```bash
npm run build
```

`npm run build`가 성공하면 GitHub Pages에서도 대체로 성공한다.

## 배포하기

글을 추가하거나 수정한 뒤:

```bash
git status
git add .
git commit -m "Add new memo"
git push
```

push하면 GitHub Actions가 자동으로 사이트를 다시 만든다. 보통 1분 안팎이면 반영된다.

배포 상태 확인:

```bash
gh run list --repo winterrainlee/winterrainlee.github.io --limit 3
```

## 글 수정하기

이미 쓴 글을 고치려면 해당 `.md` 파일을 수정하고 다시 commit/push하면 된다.

날짜를 그대로 두면 원래 작성일을 유지한다. 큰 개정이라면 `updated`를 추가할 수 있다.

```md
updated: 2026-05-01
```

현재 화면에는 `updated`가 따로 표시되지는 않지만, 나중에 표시 기능을 추가할 수 있도록 데이터로 남겨둘 수 있다.

## 글 숨기기와 삭제

잠시 숨기기:

```md
draft: true
```

완전히 삭제:

```text
해당 .md 파일 삭제
```

삭제 후에도 Git 기록에는 남는다. 정적 블로그라서 배포된 사이트에서는 다음 배포 이후 사라진다.

## 이미지 넣기

이미지는 `public/images/` 아래에 둔다.

권장 구조:

```text
public/images/2026-04-26-rainy-evening/photo.jpg
```

본문에서 사용:

```md
![비 오는 창문](/images/2026-04-26-rainy-evening/photo.jpg)
```

이미지는 너무 큰 원본을 그대로 올리지 않는 편이 좋다. 긴 변 기준 1600px 안팎이면 대부분 충분하다.

## Timeline 관리

Timeline은 별도로 글을 쓰는 곳이 아니다. `memo`, `articles`, `self-practice`에 있는 모든 글을 날짜순으로 모아 보여준다.

따라서 Timeline 순서를 바꾸고 싶으면 각 글의 `date`를 조정하면 된다.

## 검색 관리

검색은 Pagefind가 빌드할 때 자동으로 만든다.

새 글을 추가하면:

```bash
npm run build
```

이 과정에서 `dist/pagefind/` 검색 인덱스가 다시 생성된다. 별도의 검색 서버는 없다.

## 포털형 블로그와 다른 점

| 포털형/설치형 블로그 | 이 블로그 |
| --- | --- |
| 웹 관리자에서 글 작성 | Markdown 파일로 글 작성 |
| 저장 버튼으로 공개 | Git commit/push로 공개 |
| 서버나 플랫폼이 글을 DB에서 불러옴 | 빌드된 정적 HTML을 제공 |
| 검색/목록이 서비스 기능 | 빌드 시 검색 인덱스와 목록 생성 |
| 플랫폼 UI에 맞춰 운영 | 디자인과 구조를 직접 바꿀 수 있음 |

## 조심할 점

- `src/content/...` 아래의 글 파일을 지우면 배포 후 글도 사라진다.
- 파일 이름을 바꾸면 URL도 바뀐다.
- `date`가 미래 날짜여도 현재는 숨기지 않는다.
- `npm run build`가 실패하면 GitHub Actions 배포도 실패할 가능성이 크다.
- `dist/`와 `node_modules/`는 직접 관리하지 않는다. 저장소에도 올리지 않는다.

## 추천 운영 루틴

memo는 가볍게 자주 쓴다.

```text
src/content/memo/YYYY-MM-DD-short-title.md
```

생각이 쌓이면 article로 옮긴다.

```text
src/content/articles/YYYY-MM-DD-topic.md
```

무언가를 만져보고 배운 기록은 self-practice에 둔다.

```text
src/content/self-practice/YYYY-MM-DD-thing-i-tried.md
```

글을 공개하기 전에는 한 번만 확인한다.

```bash
npm run build
```

문제가 없으면 배포한다.

```bash
git add .
git commit -m "Add ..."
git push
```

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

GitHub Actions 상태도 확인한다.

```bash
gh run list --repo winterrainlee/winterrainlee.github.io --limit 3
```

### URL이 바뀌었다

파일 이름을 바꾸면 URL도 바뀐다. 이미 공유한 글은 파일 이름을 되도록 유지하는 편이 좋다.

### 검색에 새 글이 안 나온다

배포가 아직 끝나지 않았을 수 있다. GitHub Pages는 캐시가 있어 몇 분 늦게 보일 때도 있다.

## 이 블로그의 핵심 원칙

- memo는 가볍게.
- article은 조금 더 천천히.
- self-practice는 결과보다 과정을 남긴다.
- 완벽한 운영보다 계속 남기는 것을 우선한다.
