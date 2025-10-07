/**
 * Debug Aggregation Key Generation
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const normalizeItemType = (type?: string | null): string => {
  if (!type) {
    return 'NONE';
  }
  const withoutTier = type.replace(/^T\d+_/, '');
  return withoutTier.replace(/@\d+$/, '');
};

const aggregateKey = (equipment: any) => {
  const weapon = normalizeItemType(equipment?.MainHand?.Type);
  const head = normalizeItemType(equipment?.Head?.Type);
  const armor = normalizeItemType(equipment?.Armor?.Type);
  const shoes = normalizeItemType(equipment?.Shoes?.Type);
  const cape = normalizeItemType(equipment?.Cape?.Type);

  if (weapon === 'NONE' && armor === 'NONE') {
    return null;
  }

  return `${weapon}|${head}|${armor}|${shoes}|${cape}`;
};

async function debugAggregation() {
  const { data: kills } = await supabase
    .from('kill_events')
    .select('killerEquipment')
    .limit(100);

  if (!kills) return;

  let validKeys = 0;
  let nullKeys = 0;
  const samples: any[] = [];

  kills.forEach((kill) => {
    const key = aggregateKey(kill.killerEquipment);
    if (key) {
      validKeys++;
      if (samples.length < 5) samples.push({ key, equip: kill.killerEquipment });
    } else {
      nullKeys++;
    }
  });

  console.log(`Valid keys: ${validKeys}/${kills.length}`);
  console.log(`Null keys: ${nullKeys}/${kills.length}`);
  console.log('\nSample keys:');
  samples.forEach(s => console.log(s.key));
}

debugAggregation();
