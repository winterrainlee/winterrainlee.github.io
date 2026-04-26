# 원격 블로그 작성 가이드

작성일: 2026-04-26

이 문서는 맥미니가 아닌 다른 기기에서 겨울비 블로그를 작성하고 배포하는 방법을 정리한다.

전제:

- Obsidian Sync Standard를 사용 중이다.
- 블로그 vault는 Obsidian Sync에 추가하지 않는다.
- 블로그 동기화와 배포는 GitHub 저장소를 기준으로 한다.
- 저장소는 `winterrainlee/winterrainlee.github.io`다.

## 핵심 원칙

```text
쓰기 전: Pull
쓰기 후: Commit + Push
```

여러 기기에서 같은 저장소를 만질 때 가장 중요한 습관이다. 글을 쓰기 전에 최신 상태를 받아오고, 글을 쓴 뒤에는 바로 올린다.

## 기기별 추천 방식

| 기기 | 추천 방식 | 배포 가능 여부 |
| --- | --- | --- |
| 맥미니 | Obsidian 또는 VS Code + GitHub Desktop | 가능 |
| Windows 데스크탑 | Obsidian 또는 VS Code + GitHub Desktop | 가능 |
| iPad | GitHub 웹 편집 또는 Working Copy | 가능하지만 제한 있음 |
| iPhone | 짧은 수정, memo 초안, GitHub 웹 편집 | 가능하지만 비권장 |

가장 편한 원격 작성 기기는 Windows 데스크탑이다. iPad와 iPhone은 긴 글 작성이나 이미지 관리, 충돌 해결이 불편하므로 가벼운 수정이나 초안 작성에 더 적합하다.

## Windows 데스크탑에서 작업하기

Windows에서는 맥미니와 거의 같은 방식으로 운영할 수 있다.

### 처음 한 번만 준비

설치할 앱:

- GitHub Desktop
- VS Code
- Obsidian
- Node.js LTS

GitHub Desktop에서 저장소를 clone한다.

```text
winterrainlee/winterrainlee.github.io
```

추천 로컬 경로:

```text
C:\Users\<사용자이름>\Documents\Blog
```

Obsidian에서는 이 폴더를 vault로 연다.

```text
C:\Users\<사용자이름>\Documents\Blog
```

### 글 쓰기 전

GitHub Desktop에서:

1. 저장소를 선택한다.
2. `Fetch origin`을 누른다.
3. 새 변경이 있으면 `Pull origin`을 누른다.

### 글 쓰기

Obsidian 또는 VS Code에서 글을 만든다.

```text
src/content/memo/
src/content/articles/
src/content/self-practice/
```

새 글은 템플릿을 복사해서 시작한다.

```text
docs/templates/memo-template.md
docs/templates/article-template.md
docs/templates/self-practice-template.md
```

### 미리보기

VS Code 터미널에서:

```bash
npm install
npm run dev
```

브라우저에서 확인:

```text
http://localhost:4321/
```

`npm install`은 처음 한 번만 필요하다. 이후에는 `npm run dev`만 실행하면 된다.

정식 빌드 확인:

```bash
npm run build
```

### 배포

GitHub Desktop에서:

1. 변경 파일을 확인한다.
2. commit 메시지를 쓴다.
3. `Commit to main`을 누른다.
4. `Push origin`을 누른다.

GitHub Actions가 자동으로 배포한다.

## iPad에서 작업하기

iPad에서는 두 가지 방식이 있다.

### 방식 A: GitHub 웹에서 직접 수정

가장 단순하지만 긴 글 작성에는 불편하다.

1. Safari에서 저장소를 연다.

```text
https://github.com/winterrainlee/winterrainlee.github.io
```

2. 글을 넣을 폴더로 이동한다.

```text
src/content/memo/
src/content/articles/
src/content/self-practice/
```

3. 새 파일을 만든다.
4. 템플릿 내용을 붙여넣는다.
5. commit한다.

장점:

- 별도 앱이 거의 필요 없다.
- 바로 GitHub에 commit할 수 있다.

단점:

- 긴 글 작성이 불편하다.
- 이미지 추가가 번거롭다.
- 로컬 미리보기가 어렵다.

### 방식 B: Working Copy 사용

더 본격적으로 iPad에서 작업하려면 Git 클라이언트 앱인 Working Copy를 사용할 수 있다.

흐름:

```text
Working Copy로 저장소 clone
  -> Obsidian 또는 텍스트 편집 앱에서 파일 수정
  -> Working Copy에서 commit/push
```

이 방식은 GitHub 웹보다 낫지만, 처음 설정이 조금 번거롭다. iPad에서 글을 자주 쓸 계획이 있을 때만 추천한다.

### iPad 추천 사용법

iPad에서는 완성 글을 바로 배포하기보다 초안 작성에 쓰는 편이 안전하다.

추천:

- 짧은 memo 작성
- 기존 글의 오타 수정
- 초안 작성 후 맥미니나 Windows에서 최종 확인

비추천:

- 카테고리 구조 변경
- 이미지가 많은 글 작성
- 충돌 해결
- 대규모 디자인 수정

## iPhone에서 작업하기

iPhone은 블로그 운영의 주 작업 기기로는 추천하지 않는다. 화면이 작고 Git 작업, 이미지 관리, 충돌 해결이 어렵다.

그래도 가능은 하다.

### 가능한 작업

- GitHub 웹에서 오타 수정
- 짧은 memo 추가
- 급하게 `draft: true`로 글 숨기기
- GitHub Actions 배포 상태 확인

### 추천하지 않는 작업

- 긴 article 작성
- self-practice처럼 코드나 절차가 많은 글 작성
- 이미지 업로드
- 여러 파일을 동시에 수정
- 카테고리 추가

### iPhone에서 급하게 memo 추가하기

1. GitHub 앱 또는 Safari에서 저장소를 연다.
2. `src/content/memo/`로 이동한다.
3. 새 `.md` 파일을 만든다.
4. 아래처럼 최소 frontmatter를 넣는다.

```md
---
title: "짧은 제목"
description: "짧은 설명"
date: 2026-04-26
tags: ["memo"]
---

본문.
```

5. commit한다.

## 여러 기기에서 충돌을 줄이는 법

### 반드시 지킬 것

- 작업 전 `Pull`.
- 작업 후 바로 `Push`.
- 같은 글을 두 기기에서 동시에 수정하지 않는다.
- 긴 글은 한 기기에서 마무리한다.
- 파일 이름을 자주 바꾸지 않는다.

### 충돌이 생기기 쉬운 상황

- 맥미니에서 글을 수정했는데 push하지 않고 Windows에서도 같은 글을 수정한 경우
- iPad GitHub 웹에서 글을 고쳤는데 Windows에서 pull하지 않고 같은 파일을 수정한 경우
- 같은 이미지 파일을 여러 기기에서 다른 내용으로 교체한 경우

### 충돌이 생겼을 때

가장 안전한 대응:

1. 당황해서 아무 버튼이나 누르지 않는다.
2. GitHub Desktop에서 어떤 파일이 충돌인지 확인한다.
3. VS Code에서 충돌 파일을 연다.
4. 남길 내용을 직접 선택한다.
5. 저장 후 commit한다.

충돌 표시 예시:

```text
<<<<<<< HEAD
내 컴퓨터의 내용
=======
원격 저장소의 내용
>>>>>>> origin/main
```

이 표시가 남아 있으면 글이 깨질 수 있으니 반드시 지워야 한다.

## 이미지가 있는 글을 원격에서 쓰기

이미지는 가능하면 맥미니나 Windows에서 추가하는 편이 좋다.

권장 위치:

```text
public/images/YYYY-MM-DD-slug/image.jpg
```

본문:

```md
![이미지 설명](/images/YYYY-MM-DD-slug/image.jpg)
```

iPhone/iPad에서 이미지를 바로 넣는 것도 가능하지만, 파일 크기 조정과 경로 관리가 번거롭다. 모바일에서는 글만 작성하고 이미지는 데스크탑에서 마무리하는 흐름을 추천한다.

## 기기별 추천 루틴

### 맥미니

```text
Pull
  -> Obsidian 또는 VS Code 작성
  -> npm run build
  -> GitHub Desktop commit/push
```

### Windows 데스크탑

```text
Fetch/Pull in GitHub Desktop
  -> Obsidian 또는 VS Code 작성
  -> npm run dev 또는 npm run build
  -> Commit + Push in GitHub Desktop
```

### iPad

```text
GitHub 웹 또는 Working Copy
  -> 짧은 수정/초안 작성
  -> commit/push
  -> 데스크탑에서 나중에 확인
```

### iPhone

```text
긴급 수정만
  -> 짧은 memo 또는 오타 수정
  -> commit
  -> 데스크탑에서 나중에 확인
```

## 가장 추천하는 운영 방식

평소:

```text
Obsidian 개인 vault에서 생각 조각 작성
```

블로그로 공개할 때:

```text
맥미니 또는 Windows의 Blog vault로 옮김
  -> src/content/...에 저장
  -> 로컬 확인
  -> GitHub Desktop으로 commit/push
```

모바일:

```text
초안과 긴급 수정만
```

이 방식이 가장 덜 꼬인다. Obsidian Sync Standard를 유지하면서도 GitHub Pages 블로그를 안정적으로 운영할 수 있다.
