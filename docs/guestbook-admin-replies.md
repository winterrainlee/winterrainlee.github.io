# Guestbook admin replies

블로그 안에서 방명록 답글을 관리하는 페이지입니다.

관리자 페이지:

```text
/admin/guestbook/
```

## Supabase secrets

답글 저장 함수는 브라우저에서 직접 DB를 수정하지 않고, Supabase Edge Function을 통해 `owner_reply`와 `owner_replied_at`만 수정합니다.

아래 secret을 설정해야 합니다.

```sh
supabase secrets set ADMIN_REPLY_SECRET='관리자 답글 비밀번호'
```

`SUPABASE_SERVICE_ROLE_KEY`와 `SUPABASE_URL`은 Supabase Edge Functions에 기본으로 제공됩니다. 직접 `supabase secrets set`으로 넣지 않아도 됩니다.

설정 후 함수를 배포합니다.

```sh
supabase functions deploy reply-guestbook --no-verify-jwt
```

비밀 답글 열람 기능을 위해 방명록 작성/비밀 답글 확인 함수도 배포합니다.

```sh
supabase functions deploy create-guestbook --no-verify-jwt
supabase functions deploy view-secret-reply --no-verify-jwt
supabase functions deploy list-guestbook-admin --no-verify-jwt
supabase functions deploy delete-guestbook --no-verify-jwt
```

## 사용 방법

1. `/admin/guestbook/`에 접속합니다.
2. `ADMIN_REPLY_SECRET`에 넣은 관리자 비밀번호를 입력합니다.
3. `새로고침`을 누릅니다.
4. 각 방명록 글 아래 답글을 작성하거나 삭제합니다.
5. 답글은 `저장`, 삭제는 `삭제`를 누릅니다.

공개글 답글은 `/guestbook/`에 공개로 표시됩니다.
비밀글 답글은 공개 목록에서는 숨겨집니다.
비밀글 작성자가 본인 비밀번호를 입력하면 비밀 답글을 볼 수 있습니다.
