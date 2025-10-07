/**
 * Aggregate Meta Builds from Kill Events
 * Run this to populate the meta_builds table
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

  return type.replace(/^T\d+_/, '').replace(/@\d+$/, '');
};

const isHealerWeapon = (normalizedWeapon: string): boolean => {
  if (!normalizedWeapon || normalizedWeapon === 'NONE') {
    return false;
  }

  return /HOLYSTAFF|DIVINESTAFF|SMITESTAFF|FALLENSTAFF|LIFETOUCHSTAFF|REDEMPTIONSTAFF|GREATHOLYSTAFF|NATURESTAFF|DRUIDSTAFF|WILDSTAFF|REJUVENATIONSTAFF|IRONROOTSTAFF|FRAIVESTAFF/i.test(
    normalizedWeapon
  );
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

  return {
    key: `${weapon}|${head}|${armor}|${shoes}|${cape}`,
    weapon,
    head,
    armor,
    shoes,
    cape,
  };
};

async function aggregateMetaBuilds() {
  console.log('🔄 Fetching kill events...');

  // First get the total count
  const { count: totalCount } = await supabase
    .from('kill_events')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total kill events in database: ${totalCount}`);

  // Fetch ALL kills using pagination to bypass Supabase's 1000 record limit
  let allKills: any[] = [];
  const batchSize = 1000;
  let offset = 0;

  while (offset < (totalCount || 0)) {
    console.log(
      `📥 Fetching batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil((totalCount || 0) / batchSize)} (${offset + 1}-${Math.min(offset + batchSize, totalCount || 0)})`
    );

    const { data: batch, error } = (await supabase
      .from('kill_events')
      .select('*')
      .range(offset, offset + batchSize - 1)
      .order('timestamp', { ascending: false })) as { data: any[] | null; error: any };

    if (error) {
      console.error('❌ Error fetching batch:', error);
      return;
    }

    if (!batch || batch.length === 0) {
      break;
    }

    allKills.push(...batch);
    offset += batchSize;
  }

  const kills = allKills;

  if (!kills || kills.length === 0) {
    console.log('⚠️  No kill events found');
    return;
  }

  console.log(`✅ Processing ${kills.length} kill events...`);

  // Aggregate builds
  const buildStats = new Map<
    string,
    {
      key: string;
      weapon: string;
      head: string;
      armor: string;
      shoes: string;
      cape: string;
      kills: number;
      deaths: number;
      totalFame: number;
      healerAppearances: number;
    }
  >();

  kills.forEach((kill) => {
    // Process killer's build
    const killerBuild = aggregateKey(kill.killerEquipment);
    if (killerBuild) {
      const existing = buildStats.get(killerBuild.key) || {
        ...killerBuild,
        kills: 0,
        deaths: 0,
        totalFame: 0,
        healerAppearances: 0,
      };
      existing.kills++;
      existing.totalFame += kill.totalFame || 0;
      if (isHealerWeapon(killerBuild.weapon)) {
        existing.healerAppearances += 1;
      }
      buildStats.set(killerBuild.key, existing);
    }

    // Process victim's build (counts as death)
    const victimBuild = aggregateKey(kill.victimEquipment);
    if (victimBuild) {
      const existing = buildStats.get(victimBuild.key) || {
        ...victimBuild,
        kills: 0,
        deaths: 0,
        totalFame: 0,
        healerAppearances: 0,
      };
      existing.deaths++;
      if (isHealerWeapon(victimBuild.weapon)) {
        existing.healerAppearances += 1;
      }
      buildStats.set(victimBuild.key, existing);
    }
  });

  console.log(`📊 Found ${buildStats.size} unique builds`);

  // Clear existing meta builds
  console.log('🗑️  Clearing old meta builds...');
  await supabase.from('meta_builds').delete().neq('build_id', '');

  // Insert new builds
  console.log('💾 Inserting new meta builds...');

  const buildsToInsert = Array.from(buildStats.values())
    .filter((build) => build.kills + build.deaths >= 3) // Min 3 sample size
    .map((build) => {
      const total = build.kills + build.deaths;
      const winRate = total > 0 ? build.kills / total : 0;
      const popularity = total / kills.length;
      const avgFame = build.kills > 0 ? build.totalFame / build.kills : 0;
      const isHealer = build.healerAppearances > 0;

      return {
        build_id: build.key,
        weapon_type: build.weapon !== 'NONE' ? build.weapon : null,
        head_type: build.head !== 'NONE' ? build.head : null,
        armor_type: build.armor !== 'NONE' ? build.armor : null,
        shoes_type: build.shoes !== 'NONE' ? build.shoes : null,
        cape_type: build.cape !== 'NONE' ? build.cape : null,
        kills: build.kills,
        deaths: build.deaths,
        win_rate: winRate,
        popularity: popularity,
        avg_fame: avgFame,
        sample_size: total,
        is_healer: isHealer,
      };
    });

  console.log(`📝 Inserting ${buildsToInsert.length} builds...`);

  // Insert in batches of 100
  for (let i = 0; i < buildsToInsert.length; i += 100) {
    const batch = buildsToInsert.slice(i, i + 100);
    const { error: insertError } = await supabase.from('meta_builds').insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / 100 + 1}:`, insertError);
    } else {
      console.log(`✅ Inserted batch ${i / 100 + 1} (${batch.length} builds)`);
    }
  }

  console.log('🎉 Meta builds aggregation complete!');
  console.log(`📊 Total builds: ${buildsToInsert.length}`);
  console.log(`🏆 Top 5 builds by win rate:`);

  buildsToInsert
    .sort((a, b) => b.win_rate - a.win_rate)
    .slice(0, 5)
    .forEach((build, i) => {
      console.log(
        `  ${i + 1}. ${build.weapon_type} - ${(build.win_rate * 100).toFixed(1)}% WR (${build.sample_size} games)`
      );
    });
}

aggregateMetaBuilds()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
