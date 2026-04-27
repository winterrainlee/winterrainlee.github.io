---
created: 2026-04-27
updated: 2026-04-27
---

# 블로그 글 작성 가이드

이 문서는 블로그에 올릴 글을 쓰는 방법을 설명한다. 터미널, 배포, GitHub Actions 같은 운영 절차는 `docs/blog-management-guide.md`를 보면 된다.

## 어디에 글을 쓰나

블로그 글은 반드시 `src/content/` 아래의 카테고리 폴더에 둔다.

```text
src/content/memo/
src/content/articles/
src/content/self-practice/
```

카테고리 기준:

- `memo`: 짧은 단상, 아직 덜 다듬은 생각, 가벼운 기록
- `articles`: 생각을 정리해서 쓴 긴 글
- `self-practice`: 직접 해본 것, 배운 것, 다시 볼 절차

예를 들어 새 memo를 쓴다면 이런 파일을 만든다.

```text
src/content/memo/2026-04-27-rainy-evening.md
```

## 파일 이름

파일 이름은 글의 URL이 된다. 관리와 공유를 생각하면 영어 소문자와 하이픈을 권장한다.

권장:

```text
2026-04-27-rainy-evening.md
my-first-agent-note.md
why-i-keep-writing.md
```

비권장:

```text
새 글.md
최종진짜최종.md
memo 1.md
```

`src/content/memo/first-note.md`는 웹에서 아래 주소가 된다.

```text
https://winterrainlee.github.io/memo/first-note/
```

## 글의 기본 모양

모든 글은 맨 위에 frontmatter가 필요하다. `---`로 감싼 정보 영역이다.

```md
---
title: "비 오는 저녁"
description: "문득 오래 남은 저녁의 감각"
date: 2026-04-27
tags: ["daily", "rain"]
draft: false
---

비가 오면 창밖이 조금 더 조용해진다.

오늘은 해야 할 말보다 남겨둘 문장이 먼저 떠올랐다.
```

자주 쓰는 항목:

- `title`: 글 제목. 필수.
- `description`: 목록, 검색, RSS에 보일 짧은 설명. 권장.
- `date`: 작성일. 필수. `YYYY-MM-DD` 형식 권장.
- `updated`: 크게 고친 날짜. 필요할 때만 쓴다.
- `tags`: 태그 목록. 없으면 `[]`로 두거나 생략할 수 있다.
- `draft`: `true`로 두면 배포 목록에서 제외된다.

초안으로 숨기고 싶을 때:

```md
draft: true
```

## Markdown 기본 문법

### 제목

글 제목은 frontmatter의 `title`에 이미 있으므로, 본문에서는 보통 `##`부터 쓴다.

```md
## 큰 단락

### 작은 단락
```

### 문단

문단을 나누려면 한 줄을 비운다.

```md
첫 번째 문단이다.

두 번째 문단이다.
```

### 목록

```md
- 첫 번째
- 두 번째
- 세 번째
```

순서가 중요하면 숫자 목록을 쓴다.

```md
1. 먼저 파일을 만든다.
2. 내용을 쓴다.
3. 미리 본다.
```

### 강조

```md
*기울임*
**굵게**
`짧은 코드나 파일 이름`
```

### 링크

외부 사이트 링크:

```md
[GitHub](https://github.com/winterrainlee)
```

일반 Markdown 링크는 그대로 웹 링크가 된다.

### 인용

```md
> 오래 남는 문장은 대개 늦게 이해된다.
```

### 코드 블록

짧은 명령이나 코드 조각을 남길 때 쓴다.

````md
```bash
npm run build
```
````

언어 이름을 붙이면 문법 강조가 된다.

````md
```js
console.log("hello");
```
````

### 구분선

긴 글에서 장면을 나눌 때 쓴다.

```md
---
```

## 이미지 넣기

이미지는 `public/images/` 아래에 둔다.

권장 구조:

```text
public/images/2026-04-27-rainy-evening/photo.jpg
```

본문에서 사용:

```md
![비 오는 창문](/images/2026-04-27-rainy-evening/photo.jpg)
```

이미지는 너무 큰 원본을 그대로 올리지 않는 편이 좋다. 긴 변 기준 1600px 안팎이면 대부분 충분하다.

## 블로그 글끼리 연결하기

이 블로그는 Obsidian식 링크를 지원한다. Obsidian에서 편하게 쓰는 `[[...]]` 문법을 그대로 본문에 적으면, 웹에서는 자동으로 실제 링크가 된다.

### 기본 링크

```md
[[first-note]]
```

웹에서는 아래 글로 연결된다.

```text
/memo/first-note/
```

### 표시 문구 바꾸기

글 파일 이름 대신 자연스러운 문구를 보이게 하려면 `|` 뒤에 표시할 말을 쓴다.

```md
[[first-note|첫번째 메모]]
```

웹에서는 이렇게 보인다.

```md
[첫번째 메모](/memo/first-note/)
```

본문에서는 이런 식으로 쓸 수 있다.

```md
[[first-note|첫번째 메모]]에도 적었지만 나는 꾸준히 뭔가 적는 걸 참 못한다.
```

### 카테고리를 명시하기

같은 이름의 파일이 여러 카테고리에 생길 수 있다. 그럴 때는 카테고리를 같이 쓴다.

```md
[[memo/first-note|첫번째 메모]]
[[articles/article-intro|블로그 소개 글]]
[[self-practice/hello-blog|블로그 연습 기록]]
```

카테고리를 명시하면 어떤 글을 가리키는지 더 분명하다.

### 지원하는 규칙

지원:

```md
[[first-note]]
[[first-note|첫번째 메모]]
[[memo/first-note]]
[[memo/first-note|첫번째 메모]]
```

아직 별도로 활용하지 않는 형태:

```md
[[first-note#어떤-제목]]
```

현재는 `#어떤-제목` 부분을 세밀하게 연결하지 않고, 글 페이지로 연결하는 용도로만 생각하면 된다.

주의할 점:

- 연결 대상 파일이 `src/content/...` 아래에 있어야 한다.
- 같은 파일 이름이 여러 카테고리에 있으면 `[[first-note]]`처럼 짧은 링크가 모호할 수 있다.
- 링크가 모호하면 `[[memo/first-note]]`처럼 카테고리를 붙인다.

## Obsidian 주석 숨기기

Obsidian 주석 문법도 지원한다. `%% ... %%` 안에 쓴 내용은 웹에 표시되지 않는다.

```md
%% 이 문장은 나만 보는 메모라서 웹에 나오지 않는다. %%
```

문장 중간에 써도 된다.

```md
이 문장은 보인다. %%이 부분은 숨긴다.%% 이 문장도 보인다.
```

활용 예:

```md
%% 나중에 이 문단에 참고 링크 추가하기 %%

오늘은 여기까지만 적어둔다.
```

주의할 점:

- 주석은 공개 사이트에 보이지 않지만, GitHub 저장소 파일에는 남는다.
- 정말 민감한 비밀번호, 토큰, 개인 정보는 주석에도 쓰지 않는다.
- 공개하면 안 되는 운영 정보는 `docs/private/`나 별도 비공개 장소에 둔다.

## Obsidian에서 쓸 때

이 블로그 폴더를 Obsidian에서 별도 vault로 열 수 있다.

```text
/Users/kioku/Documents/Blog
```

새 노트를 만들 때는 반드시 아래 폴더 중 하나에 만든다.

```text
src/content/memo/
src/content/articles/
src/content/self-practice/
```

Obsidian에서 링크를 만들 때는 가능한 한 블로그 글 파일 이름을 기준으로 쓴다.

```md
[[first-note|첫번째 메모]]
```

링크 후보가 헷갈리면 카테고리까지 쓴다.

```md
[[memo/first-note|첫번째 메모]]
```

## 공개 전 확인

글을 공개하기 전에 아래를 확인한다.

- 글 파일이 `src/content/...` 아래에 있는가?
- frontmatter의 `title`과 `date`가 있는가?
- 아직 숨길 글이면 `draft: true`인가?
- 파일 이름을 바꿔도 괜찮은가?
- Obsidian 주석에 민감한 내용이 들어 있지 않은가?
- 다른 글 링크가 모호하지 않은가?

가능하면 한 번 빌드한다.

```bash
npm run build
```

## 처음 쓸 때 추천 흐름

1. `memo`에 짧게 쓴다.
2. 필요한 곳에 `%% 나만 보는 메모 %%`를 남긴다.
3. 관련 글은 `[[memo/first-note|첫번째 메모]]`처럼 연결한다.
4. 공개하기 전 `draft: true`를 확인한다.
5. 괜찮으면 commit/push해서 배포한다.

글 하나를 완벽하게 만드는 것보다, 다시 찾아갈 수 있게 남기는 쪽을 우선한다.
