/**
 * Web Worker for Meta Builds Aggregation
 * Offloads heavy computation from main thread
 */

self.onmessage = function(e) {
  const { kills } = e.data;
  
  const normalizeItemType = (type) => {
    if (!type) return 'NONE';
    const withoutTier = type.replace(/^T\d+_/, '');
    return withoutTier.replace(/@\d+$/, '');
  };

  const aggregateKey = (equipment) => {
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

  const buildStats = new Map();

  kills.forEach((kill) => {
    const killerBuild = aggregateKey(kill.killerEquipment);
    if (killerBuild) {
      const existing = buildStats.get(killerBuild.key) || {
        ...killerBuild,
        kills: 0,
        deaths: 0,
        totalFame: 0,
      };
      existing.kills++;
      existing.totalFame += kill.totalFame || 0;
      buildStats.set(killerBuild.key, existing);
    }

    const victimBuild = aggregateKey(kill.victimEquipment);
    if (victimBuild) {
      const existing = buildStats.get(victimBuild.key) || {
        ...victimBuild,
        kills: 0,
        deaths: 0,
        totalFame: 0,
      };
      existing.deaths++;
      buildStats.set(victimBuild.key, existing);
    }
  });

  const builds = Array.from(buildStats.values())
    .filter(build => (build.kills + build.deaths) >= 5)
    .map(build => {
      const total = build.kills + build.deaths;
      const winRate = total > 0 ? build.kills / total : 0;
      const popularity = total / kills.length;
      const avgFame = build.kills > 0 ? build.totalFame / build.kills : 0;

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
      };
    });

  self.postMessage({ builds });
};
