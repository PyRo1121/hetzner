import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { count, error } = await supabase
  .from('kill_events')
  .select('*', { count: 'exact', head: true });

console.log('Total kill events:', count);
if (error) console.error('Error:', error);