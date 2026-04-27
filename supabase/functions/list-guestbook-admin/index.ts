type GuestbookEntry = {
  id: string;
  name: string;
  body: string | null;
  is_secret: boolean;
  owner_reply: string | null;
  owner_replied_at: string | null;
  created_at: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-reply-secret',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
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

  const entriesResponse = await fetch(
    `${supabaseUrl}/rest/v1/guestbook_entries?select=id,name,body,is_secret,owner_reply,owner_replied_at,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!entriesResponse.ok) {
    const detail = await entriesResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to load entries', detail }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  const entries = (await entriesResponse.json()) as GuestbookEntry[];

  return new Response(JSON.stringify(entries), {
    status: 200,
    headers: jsonHeaders,
  });
});
