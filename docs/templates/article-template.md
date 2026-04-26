# Article 게시 템플릿

저장 위치:

```text
src/content/articles/YYYY-MM-DD-topic.md
```

복사해서 새 article 파일에 붙여넣기:

```md
---
title: "제목"
description: "여러 사안에 대한 내 생각을 한두 문장으로 요약"
date: YYYY-MM-DD
tags: ["essay"]
draft: true
---

들어가며.

이 글에서 붙잡고 싶은 질문이나 문제의식을 적는다.

## 배경

왜 이 생각을 하게 되었는지 적는다.

## 생각

핵심 생각을 차분히 정리한다.

## 남은 질문

아직 결론 내리지 못한 부분이나 다음에 더 생각해볼 부분을 남긴다.
```

작성 메모:

- article은 memo보다 더 다듬은 글이다.
- 하나의 글에 하나의 중심 질문을 두면 읽기 쉽다.
- 공개할 준비가 되면 `draft: false`로 바꾸거나 `draft` 줄을 지운다.
