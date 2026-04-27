type ReplyRequest = {
  id?: string;
  owner_reply?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-reply-secret',
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

  const adminSecret = Deno.env.get('ADMIN_REPLY_SECRET');
  const requestSecret = request.headers.get('x-admin-reply-secret');

  if (!adminSecret) {
    return new Response(JSON.stringify({ error: 'ADMIN_REPLY_SECRET is not set' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  if (requestSecret !== adminSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
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

  const payload = (await request.json()) as ReplyRequest;
  const id = payload.id?.trim();
  const reply = payload.owner_reply?.trim() ?? '';

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing guestbook entry id' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (reply.length > 1000) {
    return new Response(JSON.stringify({ error: 'Reply is too long' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/guestbook_entries?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      owner_reply: reply || null,
      owner_replied_at: reply ? new Date().toISOString() : null,
    }),
  });

  if (!updateResponse.ok) {
    const detail = await updateResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to save reply', detail }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: jsonHeaders,
  });
});
