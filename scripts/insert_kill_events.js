const fs = require('fs');

async function main() {
  const BASE = 'https://gameinfo.albiononline.com/api/gameinfo';
  const r = await fetch(`${BASE}/events?limit=5&offset=0`);
  const events = await r.json();
  const esc = (s) => String(s ?? '').replace(/'/g, "''");
  const j = (o) => JSON.stringify(o ?? null);

  let sql = 'BEGIN;\n';
  for (const ev of events) {
    const killer = ev.Killer || ev.killer || {};
    const victim = ev.Victim || ev.victim || {};
    const killerParticipant = Array.isArray(ev.Participants)
      ? ev.Participants.find((p) => p.Id === killer.Id)
      : null;
    const damageDone = killerParticipant?.DamageDone ?? null;

    sql += `INSERT INTO public.kill_events (
      id,
      eventId,
      timestamp,
      killerId,
      killerName,
      killerGuildId,
      killerGuildName,
      killerAllianceId,
      killerAllianceName,
      killerItemPower,
      killerDamageDone,
      killerEquipment,
      victimId,
      victimName,
      victimGuildId,
      victimGuildName,
      victimAllianceId,
      victimAllianceName,
      victimItemPower,
      victimEquipment,
      victimInventory,
      totalFame,
      location,
      numberOfParticipants,
      battleId,
      participants,
      server,
      createdAt
    ) VALUES (
      'ke_${ev.EventId}',
      '${ev.EventId}',
      TIMESTAMPTZ '${ev.TimeStamp}',
      '${esc(killer.Id)}',
      '${esc(killer.Name)}',
      '${esc(killer.GuildId)}',
      '${esc(killer.GuildName)}',
      '${esc(killer.AllianceId)}',
      '${esc(killer.AllianceName)}',
      ${killer.AverageItemPower ?? 'NULL'},
      ${damageDone ?? 'NULL'},
      '${esc(j(killer.Equipment))}',
      '${esc(victim.Id)}',
      '${esc(victim.Name)}',
      '${esc(victim.GuildId)}',
      '${esc(victim.GuildName)}',
      '${esc(victim.AllianceId)}',
      '${esc(victim.AllianceName)}',
      ${victim.AverageItemPower ?? 'NULL'},
      '${esc(j(victim.Equipment))}',
      '${esc(j(victim.Inventory))}',
      ${ev.TotalVictimKillFame ?? ev.KillFame ?? 0},
      '${esc(ev.Location ?? '')}',
      ${ev.numberOfParticipants ?? ev.NumberOfParticipants ?? 'NULL'},
      ${ev.BattleId ?? 'NULL'},
      '${esc(j(ev.Participants))}',
      'Americas',
      now()
    ) ON CONFLICT (eventId) DO NOTHING;\n`;
  }
  sql += 'COMMIT;\n';
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/insert_kill_events.sql', sql);
  console.log('WROTE data/insert_kill_events.sql');
}

main().catch((err) => {
  console.error('Failed to generate SQL:', err);
  process.exit(1);
});
