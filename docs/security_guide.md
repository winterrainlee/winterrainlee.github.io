---
created: 2026-04-27
updated: 2026-04-27
---

# Security guide

이 저장소는 공개 저장소로 운영될 수 있으므로, 문서를 추가할 때 공개해도 되는 정보와 로컬에만 남겨야 하는 정보를 구분한다.

## 공개 문서에 둘 수 있는 것

- 블로그 글 작성 방법, 템플릿, 카테고리 설명
- 일반적인 배포 흐름과 빌드 명령
- 공개 웹사이트에서 이미 확인할 수 있는 URL과 화면 설명
- 실제 값이 없는 예시 설정
- 개인 정보나 운영 secret이 빠진 개념 설명

## `docs/private/`에 둘 것

`docs/private/`는 Git에서 추적하지 않는다. 다음 정보는 이 폴더에 둔다.

- Supabase project ref, table, view, Edge Function, webhook 등 운영 구조를 그대로 설명하는 runbook
- 관리자 페이지 경로와 사용 절차
- secret 이름과 헤더 이름을 포함한 운영 절차
- Discord webhook, Supabase secret, service role key, 관리자 비밀번호와 관련된 설정 절차
- 장애 대응, 로그 확인, 수동 테스트 명령처럼 공격 표면을 좁혀 줄 수 있는 정보
- 아직 공개하지 않은 기능 설계, 보안 판단, 운영 체크리스트

## 절대 커밋하지 말 것

- `.env`와 `.env.*`
- Discord webhook URL
- Supabase service role key, JWT secret, database password
- 관리자 비밀번호 또는 공유 secret
- 실제 사용자 비밀글 본문, 비밀번호, 해시 덤프
- Supabase CLI 임시 파일

## 공개 문서 작성 기준

공개 문서에는 다음처럼 쓴다.

```text
supabase link --project-ref <project-ref>
supabase secrets set SOME_SECRET='<secret-value>'
```

실제 프로젝트 식별자, 함수 호출 헤더, 관리자 경로, 운영 secret 이름이 꼭 필요하면 `docs/private/`로 옮긴다.

## 변경 전 체크

문서를 추가하거나 수정하기 전에는 아래를 확인한다.

1. 이 정보가 공개되어도 블로그 방문자가 알아도 되는가?
2. 이 정보가 공격자가 시도할 URL, 헤더, 함수명, 테이블명을 좁혀 주는가?
3. 실제 secret은 없어도 운영 절차가 너무 자세하지 않은가?
4. 공개 문서 대신 `docs/private/`에 두는 편이 자연스럽지 않은가?

하나라도 애매하면 `docs/private/`에 둔다.
