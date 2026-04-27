# Discord guestbook notifications

방명록에 새 글이 추가되면 Supabase Database Webhook이 Edge Function을 호출하고, Edge Function이 Discord Incoming Webhook으로 알림을 보냅니다.

비밀글 본문은 Discord 알림에 포함하지 않습니다.

## 1. Discord Webhook URL 만들기

1. Discord에서 알림을 받을 서버/채널을 엽니다.
2. 채널 설정으로 들어갑니다.
3. `연동` 또는 `Integrations`를 엽니다.
4. `Webhooks`를 선택합니다.
5. `New Webhook`을 만듭니다.
6. 이름을 예를 들어 `겨울비 방명록`으로 바꿉니다.
7. `Copy Webhook URL`을 눌러 URL을 복사합니다.

이 URL은 비밀번호처럼 다뤄야 합니다. GitHub, 블로그 코드, 공개 채팅에 올리지 마세요.

## 2. Supabase CLI로 함수 배포

처음 한 번:

```sh
supabase login
supabase link --project-ref vpxsdwaeazasdcpvjpzk
```

Discord Webhook URL을 Supabase secret에 저장합니다.
알림 함수 호출을 보호할 공유 secret도 같이 만듭니다.

```sh
supabase secrets set DISCORD_WEBHOOK_URL='여기에 Discord Webhook URL'
supabase secrets set GUESTBOOK_WEBHOOK_SECRET='여기에 길고 랜덤한 문자열'
```

Edge Function을 배포합니다.

```sh
supabase functions deploy notify-guestbook --no-verify-jwt
```

## 3. Supabase Database Webhook 만들기

Supabase 대시보드에서:

1. `Database`로 이동합니다.
2. `Webhooks`를 엽니다.
3. `Create a new hook`을 누릅니다.
4. 이름은 `notify_guestbook_insert`로 둡니다.
5. Table은 `public.guestbook_entries`를 선택합니다.
6. Events는 `Insert`만 선택합니다.
7. Webhook configuration은 `Supabase Edge Functions`를 선택합니다.
8. Edge Function은 `notify-guestbook`을 선택합니다.
9. Method는 `POST`로 둡니다.
10. HTTP Headers에 아래 값을 추가합니다.
    - `Content-Type`: `application/json`
    - `x-guestbook-webhook-secret`: 위에서 `GUESTBOOK_WEBHOOK_SECRET`에 넣은 문자열
11. 저장합니다.

## 4. 테스트

블로그 `/guestbook/`에서 테스트 글을 남깁니다.

공개글이면 Discord 알림에 본문 일부가 표시됩니다.
비밀글이면 Discord 알림에는 `비밀글입니다. 본문은 알림에 포함하지 않았습니다.`라고 표시됩니다.

알림이 오지 않으면 Supabase 대시보드에서 `Edge Functions` > `notify-guestbook` > `Logs`를 확인합니다.
