/**
 * Supabase Edge Function: Aggregate Meta Builds
 * Triggered periodically or on-demand to update meta_builds table
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const normalizeItemType = (type?: string | null): string => {
  if (!type) return 'NONE';
  return type.replace(/^T\d+_/, '').replace(/@\d+$/, '');
};

const isHealerWeapon = (normalizedWeapon: string): boolean => {
  if (!normalizedWeapon || normalizedWeapon === 'NONE') {
    return false;
  }

  return /HOLYSTAFF|DIVINESTAFF|SMITESTAFF|FALLENSTAFF|LIFETOUCHSTAFF|REDEMPTIONSTAFF|GREATHOLYSTAFF|NATURESTAFF|DRUIDSTAFF|WILDSTAFF|REJUVENATIONSTAFF|IRONROOTSTAFF|FRAIVESTAFF/i.test(
    normalizedWeapon,
  );
};

const aggregateKey = (equipment: any) => {
  const weapon = normalizeItemType(equipment?.MainHand?.Type);
  const head = normalizeItemType(equipment?.Head?.Type);
  const armor = normalizeItemType(equipment?.Armor?.Type);
  const shoes = normalizeItemType(equipment?.Shoes?.Type);
  const cape = normalizeItemType(equipment?.Cape?.Type);

  if (weapon === 'NONE' && armor === 'NONE') return null;

  return {
    key: `${weapon}|${head}|${armor}|${shoes}|${cape}`,
    weapon,
    head,
    armor,
    shoes,
    cape,
  };
};

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching kill events...');
    
    const { data: kills, error } = await supabase
      .from('kill_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20000); // Last 20k kills for performance

    if (error) throw error;
    if (!kills || kills.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No kills found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${kills.length} kills...`);

    type BuildAccumulator = {
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
    };

    const buildStats = new Map<string, BuildAccumulator>();

    kills.forEach((kill: any) => {
      // Killer's build
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

      // Victim's build
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

    console.log(`Found ${buildStats.size} unique builds`);

    // Clear old builds
    await supabase.from('meta_builds').delete().neq('build_id', '');

    // Prepare new builds
    const buildsToInsert = Array.from(buildStats.values())
      .filter((build) => (build.kills + build.deaths) >= 3)
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

    console.log(`Inserting ${buildsToInsert.length} builds...`);

    // Insert in batches
    for (let i = 0; i < buildsToInsert.length; i += 100) {
      const batch = buildsToInsert.slice(i, i + 100);
      const { error: insertError } = await supabase.from('meta_builds').insert(batch);
      if (insertError) {
        console.error(`Batch ${i / 100 + 1} error:`, insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        buildsProcessed: buildsToInsert.length,
        killsAnalyzed: kills.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
