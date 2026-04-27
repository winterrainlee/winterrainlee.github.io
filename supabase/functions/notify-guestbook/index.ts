type GuestbookRecord = {
  id: string;
  name: string;
  body: string | null;
  is_secret: boolean;
  created_at: string;
};

type DatabaseWebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: GuestbookRecord | null;
  old_record: GuestbookRecord | null;
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
};

const guestbookUrl = 'https://winterrainlee.github.io/guestbook/';

Deno.serve(async (request) => {
  console.log('notify-guestbook invoked', {
    method: request.method,
    at: new Date().toISOString(),
  });

  if (request.method !== 'POST') {
    console.warn('Rejected non-POST request');
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const discordWebhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
  const webhookSecret = Deno.env.get('GUESTBOOK_WEBHOOK_SECRET');
  const requestSecret = request.headers.get('x-guestbook-webhook-secret');

  if (!discordWebhookUrl) {
    console.error('DISCORD_WEBHOOK_URL is not set');
    return new Response(JSON.stringify({ error: 'DISCORD_WEBHOOK_URL is not set' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  if (!webhookSecret) {
    console.error('GUESTBOOK_WEBHOOK_SECRET is not set');
    return new Response(JSON.stringify({ error: 'GUESTBOOK_WEBHOOK_SECRET is not set' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  if (requestSecret !== webhookSecret) {
    console.warn('Rejected request with invalid webhook secret');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const payload = (await request.json()) as DatabaseWebhookPayload;

  if (payload.type !== 'INSERT' || payload.table !== 'guestbook_entries' || !payload.record) {
    console.log('Skipped webhook payload', {
      type: payload.type,
      table: payload.table,
      hasRecord: Boolean(payload.record),
    });

    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const entry = payload.record;
  console.log('Sending Discord guestbook notification', {
    id: entry.id,
    isSecret: entry.is_secret,
  });

  const bodyPreview = entry.is_secret
    ? '비밀글입니다. 본문은 알림에 포함하지 않았습니다.'
    : truncate(entry.body?.trim() || '(내용 없음)', 700);

  const discordResponse = await fetch(discordWebhookUrl, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      username: '겨울비 방명록',
      embeds: [
        {
          title: '새 방명록 글이 도착했습니다',
          url: guestbookUrl,
          color: entry.is_secret ? 0x9a6257 : 0x2f6f8f,
          fields: [
            {
              name: '작성자',
              value: truncate(entry.name, 80),
              inline: true,
            },
            {
              name: '종류',
              value: entry.is_secret ? '비밀글' : '공개글',
              inline: true,
            },
            {
              name: '내용',
              value: bodyPreview,
            },
            {
              name: '바로가기',
              value: `[방명록에서 보기](${guestbookUrl})`,
            },
          ],
          timestamp: entry.created_at,
          footer: {
            text: `guestbook_entries/${entry.id}`,
          },
        },
      ],
    }),
  });

  if (!discordResponse.ok) {
    const errorText = await discordResponse.text();
    console.error('Discord webhook failed', {
      status: discordResponse.status,
      detail: errorText,
    });

    return new Response(JSON.stringify({ error: 'Discord webhook failed', detail: errorText }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  console.log('Discord guestbook notification sent', {
    id: entry.id,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: jsonHeaders,
  });
});
