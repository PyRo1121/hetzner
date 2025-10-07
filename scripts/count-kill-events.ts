import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function countKillEvents() {
  const { count, error } = await supabase
    .from('kill_events')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total kill events in DB: ${count}`);
}

countKillEvents();
