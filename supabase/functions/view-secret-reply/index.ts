import { hashPassword } from '../_shared/crypto.ts';

type ViewSecretReplyRequest = {
  id?: string;
  password?: string;
};

type GuestbookEntry = {
  is_secret: boolean;
  owner_reply: string | null;
  owner_replied_at: string | null;
  password_salt: string | null;
  password_hash: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Supabase service credentials are not set' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const payload = (await request.json()) as ViewSecretReplyRequest;
  const id = payload.id?.trim();
  const password = payload.password ?? '';

  if (!id || password.length < 1) {
    return new Response(JSON.stringify({ error: 'Missing entry id or password' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const entryResponse = await fetch(
    `${supabaseUrl}/rest/v1/guestbook_entries?id=eq.${encodeURIComponent(id)}&select=is_secret,owner_reply,owner_replied_at,password_salt,password_hash&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!entryResponse.ok) {
    const detail = await entryResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to load entry', detail }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  const [entry] = (await entryResponse.json()) as GuestbookEntry[];

  if (!entry || !entry.is_secret) {
    return new Response(JSON.stringify({ error: 'Secret entry not found' }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  if (!entry.password_salt || !entry.password_hash) {
    return new Response(JSON.stringify({ error: '이전 비밀글은 비밀번호 확인을 지원하지 않습니다.' }), {
      status: 409,
      headers: jsonHeaders,
    });
  }

  const passwordHash = await hashPassword(password, entry.password_salt);

  if (passwordHash !== entry.password_hash) {
    return new Response(JSON.stringify({ error: '비밀번호가 맞지 않습니다.' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      owner_reply: entry.owner_reply,
      owner_replied_at: entry.owner_replied_at,
    }),
    {
      status: 200,
      headers: jsonHeaders,
    },
  );
});
