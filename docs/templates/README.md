# 블로그 게시 템플릿

이 폴더는 새 글을 만들 때 복사해서 쓰는 템플릿 모음이다.

## 템플릿 목록

- `memo-template.md`: 짧은 단상
- `article-template.md`: 생각을 정리해서 쓴 글
- `self-practice-template.md`: 직접 연습하며 남긴 기록

## 사용법

1. 맞는 템플릿을 연다.
2. 코드 블록 안의 내용을 복사한다.
3. 알맞은 `src/content/...` 폴더에 새 `.md` 파일을 만든다.
4. 붙여넣고 `title`, `description`, `date`, `tags`를 수정한다.
5. 공개할 준비가 되면 `draft: false`로 바꾸거나 `draft` 줄을 지운다.

파일 위치 예시:

```text
src/content/memo/2026-04-26-rainy-evening.md
src/content/articles/2026-04-26-writing-and-memory.md
src/content/self-practice/2026-04-26-blog-workflow.md
```
