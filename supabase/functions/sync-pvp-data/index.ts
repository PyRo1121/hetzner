import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CRON_SECRET = Deno.env.get('CRON_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GAMEINFO_BASE_URL =
  Deno.env.get('GAMEINFO_BASE_URL') ?? 'https://gameinfo.albiononline.com/api/gameinfo';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { 'Content-Type': 'application/json' } },
});

const EquipmentItemSchema = z
  .object({
    Type: z.string(),
    Count: z.number().optional(),
    Quality: z.number().optional(),
    ActiveSpells: z.array(z.string()).optional(),
  })
  .passthrough();

const EquipmentSchema = z
  .object({
    MainHand: EquipmentItemSchema.nullable().optional(),
    OffHand: EquipmentItemSchema.nullable().optional(),
    Head: EquipmentItemSchema.nullable().optional(),
    Armor: EquipmentItemSchema.nullable().optional(),
    Shoes: EquipmentItemSchema.nullable().optional(),
    Bag: EquipmentItemSchema.nullable().optional(),
    Cape: EquipmentItemSchema.nullable().optional(),
    Mount: EquipmentItemSchema.nullable().optional(),
    Potion: EquipmentItemSchema.nullable().optional(),
    Food: EquipmentItemSchema.nullable().optional(),
  })
  .passthrough();

const PlayerSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    GuildId: z.string().optional().nullable(),
    GuildName: z.string().optional().nullable(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    AverageItemPower: z.number().optional(),
    Equipment: EquipmentSchema.optional(),
    Inventory: z.array(EquipmentItemSchema.nullable()).optional(),
    DamageDone: z.number().optional(),
    SupportHealingDone: z.number().optional(),
  })
  .passthrough();

const KillEventSchema = z
  .object({
    EventId: z.number(),
    TimeStamp: z.string(),
    Killer: PlayerSchema,
    Victim: PlayerSchema,
    TotalVictimKillFame: z.number(),
    Location: z.string().optional().nullable(),
    Participants: z.array(PlayerSchema).optional(),
    numberOfParticipants: z.number().optional().nullable(),
    BattleId: z.number().optional().nullable(),
  })
  .passthrough();

const BattleSchema = z
  .object({
    id: z.number(),
    name: z.string().optional().nullable(),
    startTime: z.string(),
    endTime: z.string(),
    totalKills: z.number(),
    totalFame: z.number(),
    players: z
      .object({
        a: z.array(PlayerSchema).optional(),
        b: z.array(PlayerSchema).optional(),
      })
      .optional(),
  })
  .passthrough();

type KillEvent = z.infer<typeof KillEventSchema>;
type Battle = z.infer<typeof BattleSchema>;

interface SyncStats {
  totalFetched: number;
  killsInserted: number;
  battlesInserted: number;
  duplicates: number;
  errors: number;
}

async function fetchKills(limit = 51, offset = 0): Promise<KillEvent[]> {
  const url = `${GAMEINFO_BASE_URL}/events?limit=${limit}&offset=${offset}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Gameinfo events error: ${response.status}`);
  }

  const data = await response.json();
  return z.array(KillEventSchema).parse(data);
}

// Paginated killer events fetcher to collect more than default page
async function fetchKillsPaginated(totalTarget = 600): Promise<KillEvent[]> {
  const pageSize = 51;
  const results: KillEvent[] = [];
  let offset = 0;

  while (results.length < totalTarget) {
    const batch = await fetchKills(pageSize, offset);
    if (!batch || batch.length === 0) break;
    results.push(...batch);
    if (batch.length < pageSize) break; // No more pages
    offset += pageSize;
    // Be polite to API
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}

async function fetchBattles(
  range: 'day' | 'week' | 'month' = 'day',
  limit = 20,
  offset = 0
): Promise<Battle[]> {
  const url = `${GAMEINFO_BASE_URL}/battles?range=${range}&limit=${limit}&offset=${offset}&sort=recent`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Gameinfo battles error: ${response.status}`);
  }

  const data = await response.json();
  return z.array(BattleSchema).parse(data);
}

// Paginated battles fetcher for recent battles
async function fetchBattlesPaginated(
  range: 'day' | 'week' | 'month' = 'day',
  totalTarget = 200
): Promise<Battle[]> {
  const pageSize = 50; // API supports larger pages; use moderate size
  const results: Battle[] = [];
  let offset = 0;

  while (results.length < totalTarget) {
    const batch = await fetchBattles(range, pageSize, offset);
    if (!batch || batch.length === 0) break;
    results.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}

async function upsertKillEvents(kills: KillEvent[], stats: SyncStats): Promise<void> {
  for (const kill of kills) {
    try {
      const { data: existing, error: existsError } = await supabase
        .from('kill_events')
        .select('id')
        .eq('eventId', kill.EventId)
        .maybeSingle();

      if (existsError && existsError.code !== 'PGRST116') {
        console.error('[sync-pvp-data] Check existing kill error', existsError);
      }

      if (existing) {
        stats.duplicates += 1;
        continue;
      }

      const insertResult = await supabase.from('kill_events').insert({
        id: crypto.randomUUID(),
        eventId: kill.EventId,
        timestamp: new Date(kill.TimeStamp).toISOString(),
        killerId: kill.Killer.Id,
        killerName: kill.Killer.Name,
        killerGuildId: kill.Killer.GuildId ?? null,
        killerGuildName: kill.Killer.GuildName ?? null,
        killerAllianceId: kill.Killer.AllianceId ?? null,
        killerAllianceName: kill.Killer.AllianceName ?? null,
        killerItemPower: kill.Killer.AverageItemPower ?? null,
        killerDamageDone: kill.Killer.DamageDone ?? null,
        killerEquipment: kill.Killer.Equipment ?? null,
        victimId: kill.Victim.Id,
        victimName: kill.Victim.Name,
        victimGuildId: kill.Victim.GuildId ?? null,
        victimGuildName: kill.Victim.GuildName ?? null,
        victimAllianceId: kill.Victim.AllianceId ?? null,
        victimAllianceName: kill.Victim.AllianceName ?? null,
        victimItemPower: kill.Victim.AverageItemPower ?? null,
        victimEquipment: kill.Victim.Equipment ?? null,
        victimInventory: kill.Victim.Inventory ?? null,
        totalFame: kill.TotalVictimKillFame,
        location: kill.Location ?? null,
        numberOfParticipants: kill.numberOfParticipants ?? null,
        battleId: kill.BattleId ?? null,
        participants: kill.Participants ?? null,
        server: 'Americas',
      });

      if (insertResult.error) {
        throw insertResult.error;
      }

      stats.killsInserted += 1;

      await updatePlayerStats(kill);
      await updateGuildStats(kill.Killer, true);
      await updateGuildStats(kill.Victim, false);
    } catch (error) {
      stats.errors += 1;
      console.error(`[sync-pvp-data] Kill processing error for ${kill.EventId}`, error);
    }
  }
}

async function updatePlayerStats(playerEvent: KillEvent): Promise<void> {
  const killer = playerEvent.Killer;
  const victim = playerEvent.Victim;
  const fame = playerEvent.TotalVictimKillFame;
  const timestamp = new Date(playerEvent.TimeStamp).toISOString();

  await upsertPlayer(killer, {
    killsDelta: 1,
    fameDelta: fame,
    killFameDelta: fame,
    lastKillAt: timestamp,
  });

  await upsertPlayer(victim, {
    deathsDelta: 1,
    fameDelta: fame,
    deathFameDelta: fame,
    lastDeathAt: timestamp,
  });
}

interface PlayerDelta {
  killsDelta?: number;
  deathsDelta?: number;
  fameDelta?: number;
  killFameDelta?: number;
  deathFameDelta?: number;
  lastKillAt?: string;
  lastDeathAt?: string;
}

async function upsertPlayer(player: KillEvent['Killer'], delta: PlayerDelta): Promise<void> {
  if (!player.Id) return;

  const { data: existing } = await supabase
    .from('player_pvp_stats')
    .select(
      'id,totalKills,totalDeaths,totalFame,killFame,deathFame,gamesPlayed,lastKillAt,lastDeathAt'
    )
    .eq('playerId', player.Id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('player_pvp_stats')
      .update({
        playerName: player.Name,
        guildId: player.GuildId ?? null,
        guildName: player.GuildName ?? null,
        allianceId: player.AllianceId ?? null,
        allianceName: player.AllianceName ?? null,
        totalKills: existing.totalKills + (delta.killsDelta ?? 0),
        totalDeaths: existing.totalDeaths + (delta.deathsDelta ?? 0),
        totalFame: existing.totalFame + (delta.fameDelta ?? 0),
        killFame: existing.killFame + (delta.killFameDelta ?? 0),
        deathFame: existing.deathFame + (delta.deathFameDelta ?? 0),
        gamesPlayed: existing.gamesPlayed + 1,
        lastSeenAt: delta.lastKillAt ?? delta.lastDeathAt ?? new Date().toISOString(),
        lastKillAt: delta.lastKillAt ?? existing.lastKillAt ?? null,
        lastDeathAt: delta.lastDeathAt ?? existing.lastDeathAt ?? null,
        updatedAt: new Date().toISOString(),
      })
      .eq('playerId', player.Id);
  } else {
    await supabase.from('player_pvp_stats').insert({
      id: crypto.randomUUID(),
      playerId: player.Id,
      playerName: player.Name,
      guildId: player.GuildId ?? null,
      guildName: player.GuildName ?? null,
      allianceId: player.AllianceId ?? null,
      allianceName: player.AllianceName ?? null,
      totalKills: delta.killsDelta ?? 0,
      totalDeaths: delta.deathsDelta ?? 0,
      totalFame: delta.fameDelta ?? 0,
      killFame: delta.killFameDelta ?? 0,
      deathFame: delta.deathFameDelta ?? 0,
      gamesPlayed: 1,
      lastSeenAt: delta.lastKillAt ?? delta.lastDeathAt ?? new Date().toISOString(),
      lastKillAt: delta.lastKillAt ?? null,
      lastDeathAt: delta.lastDeathAt ?? null,
      server: 'Americas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

async function updateGuildStats(player: KillEvent['Killer'], isKill: boolean): Promise<void> {
  if (!player.GuildId) return;

  const { data: existing } = await supabase
    .from('guild_pvp_stats')
    .select('id,totalKills,totalDeaths,weeklyKills,weeklyDeaths,monthlyKills,monthlyDeaths')
    .eq('guildId', player.GuildId)
    .maybeSingle();

  const updates = {
    guildName: player.GuildName ?? '',
    allianceId: player.AllianceId ?? null,
    allianceName: player.AllianceName ?? null,
    totalKills: (existing?.totalKills ?? 0) + (isKill ? 1 : 0),
    totalDeaths: (existing?.totalDeaths ?? 0) + (isKill ? 0 : 1),
    weeklyKills: (existing?.weeklyKills ?? 0) + (isKill ? 1 : 0),
    weeklyDeaths: (existing?.weeklyDeaths ?? 0) + (isKill ? 0 : 1),
    monthlyKills: (existing?.monthlyKills ?? 0) + (isKill ? 1 : 0),
    monthlyDeaths: (existing?.monthlyDeaths ?? 0) + (isKill ? 0 : 1),
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from('guild_pvp_stats').update(updates).eq('guildId', player.GuildId);
  } else {
    await supabase.from('guild_pvp_stats').insert({
      id: crypto.randomUUID(),
      guildId: player.GuildId,
      guildName: player.GuildName ?? '',
      allianceId: player.AllianceId ?? null,
      allianceName: player.AllianceName ?? null,
      totalKills: isKill ? 1 : 0,
      totalDeaths: isKill ? 0 : 1,
      weeklyKills: isKill ? 1 : 0,
      weeklyDeaths: isKill ? 0 : 1,
      monthlyKills: isKill ? 1 : 0,
      monthlyDeaths: isKill ? 0 : 1,
      server: 'Americas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

async function upsertBattles(battles: Battle[], stats: SyncStats): Promise<void> {
  for (const battle of battles) {
    try {
      const { data: existing } = await supabase
        .from('battles')
        .select('id')
        .eq('battleId', battle.id)
        .maybeSingle();

      const totalPlayers = (battle.players?.a?.length ?? 0) + (battle.players?.b?.length ?? 0);

      const upsertResult = await supabase.from('battles').upsert(
        {
          battleId: battle.id,
          name: battle.name ?? null,
          startTime: new Date(battle.startTime).toISOString(),
          endTime: new Date(battle.endTime).toISOString(),
          totalKills: battle.totalKills,
          totalFame: battle.totalFame,
          totalPlayers,
          players: battle.players ?? null,
          server: 'Americas',
          createdAt: new Date().toISOString(),
        },
        { onConflict: 'battleId' }
      );

      if (upsertResult.error) {
        throw upsertResult.error;
      }

      if (existing) {
        stats.duplicates += 1;
      } else {
        stats.battlesInserted += 1;
      }
    } catch (error) {
      stats.errors += 1;
      console.error(`[sync-pvp-data] Battle processing error for ${battle.id}`, error);
    }
  }
}

serve(async (req) => {
  if (CRON_SECRET) {
    const headerSecret = req.headers.get('x-cron-secret');
    const authorization = req.headers.get('authorization');
    const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    const authorized = headerSecret === CRON_SECRET || bearerToken === CRON_SECRET;
    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const stats: SyncStats = {
    totalFetched: 0,
    killsInserted: 0,
    battlesInserted: 0,
    duplicates: 0,
    errors: 0,
  };

  try {
    // Read optional request payload to allow dynamic limits and range
    let killsTarget = 100;
    let battlesTarget = 50;
    let range: 'day' | 'week' | 'month' = 'day';

    try {
      const body = await req.json();
      if (typeof body?.killsTarget === 'number') killsTarget = body.killsTarget;
      if (typeof body?.battlesTarget === 'number') battlesTarget = body.battlesTarget;
      if (typeof body?.range === 'string' && ['day', 'week', 'month'].includes(body.range)) {
        range = body.range;
      }
    } catch (_) {
      // No JSON body provided; use defaults
    }

    // Create a sync run log entry
    let runId: number | null = null;
    try {
      const { data: runRow, error: runErr } = await supabase
        .from('sync_runs')
        .insert({
          started_at: new Date().toISOString(),
          kills_target: killsTarget,
          battles_target: battlesTarget,
        })
        .select('id')
        .single();
      if (!runErr && runRow) runId = (runRow as { id: number }).id;
    } catch (_) {
      // If logging fails, continue with sync
    }

    const [kills, battles] = await Promise.all([
      fetchKillsPaginated(killsTarget),
      fetchBattlesPaginated(range, battlesTarget),
    ]);

    stats.totalFetched = kills.length + battles.length;

    await upsertKillEvents(kills, stats);
    await upsertBattles(battles, stats);

    // Update sync run with final stats
    if (runId !== null) {
      try {
        await supabase
          .from('sync_runs')
          .update({
            finished_at: new Date().toISOString(),
            total_fetched: stats.totalFetched,
            kills_inserted: stats.killsInserted,
            battles_inserted: stats.battlesInserted,
            duplicates: stats.duplicates,
            errors: stats.errors,
            success: true,
          })
          .eq('id', runId);
      } catch (_) {
        // Ignore logging errors
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[sync-pvp-data] Sync failure', error);
    stats.errors += 1;

    // Update sync run failure
    try {
      await supabase
        .from('sync_runs')
        .update({ finished_at: new Date().toISOString(), errors: stats.errors, success: false })
        .order('started_at', { ascending: false })
        .limit(1);
    } catch (_) {
      // Ignore logging errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
