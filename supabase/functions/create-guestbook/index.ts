import { createSalt, hashPassword } from '../_shared/crypto.ts';

type CreateGuestbookRequest = {
  name?: string;
  body?: string;
  is_secret?: boolean;
  password?: string;
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

  const payload = (await request.json()) as CreateGuestbookRequest;
  const name = payload.name?.trim() ?? '';
  const body = payload.body?.trim() ?? '';
  const password = payload.password ?? '';
  const isSecret = Boolean(payload.is_secret) || password.length > 0;

  if (name.length < 1 || name.length > 24 || body.length < 1 || body.length > 1000) {
    return new Response(JSON.stringify({ error: 'Invalid guestbook entry' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (isSecret && password.length < 4) {
    return new Response(JSON.stringify({ error: 'Secret entries need a password with at least 4 characters' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const salt = isSecret ? createSalt() : null;
  const passwordHash = isSecret && salt ? await hashPassword(password, salt) : null;

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/guestbook_entries`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      name,
      body,
      is_secret: isSecret,
      password_salt: salt,
      password_hash: passwordHash,
    }),
  });

  if (!insertResponse.ok) {
    const detail = await insertResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to create entry', detail }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: jsonHeaders,
  });
});
