// Supabase Edge Function — scheduled hourly via Supabase dashboard cron ("0 * * * *").
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
//
// Cleanup thresholds:
//   finished rooms    → delete after 1 hour
//   waiting/ready     → delete after 24 hours  (abandoned before game started)
//   playing           → delete after 2 hours   (crash/disconnect mid-game)

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const now = Date.now();
  const oneHourAgo  = new Date(now - 1 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const oneDayAgo   = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [r1, r2, r3] = await Promise.all([
    supabase.from('rooms').delete().eq('status', 'finished').lt('created_at', oneHourAgo),
    supabase.from('rooms').delete().in('status', ['waiting', 'ready']).lt('created_at', oneDayAgo),
    supabase.from('rooms').delete().eq('status', 'playing').lt('created_at', twoHoursAgo),
  ]);

  const error = r1.error?.message ?? r2.error?.message ?? r3.error?.message;
  return new Response(
    JSON.stringify(error ? { error } : { ok: true }),
    { status: error ? 500 : 200, headers: { 'Content-Type': 'application/json' } },
  );
});
