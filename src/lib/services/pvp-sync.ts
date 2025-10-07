import { type PostgrestError } from '@supabase/supabase-js';
import { backend, getGameinfoClient } from '@/backend';

import { type Battle, type KillEvent } from '@/lib/api/gameinfo/client';
import { retryWithBackoff } from '@/lib/utils/retry';

type SyncCounters = {
  killsFetched: number;
  battlesFetched: number;
  newKills: number;
  newBattles: number;
  duplicates: number;
  errors: number;
};

const supabase = backend.admin;

function isDuplicateError(error: PostgrestError | null): boolean {
  if (!error) {return false;}
  return error.code === '23505' || error.message?.toLowerCase().includes('duplicate key');
}

async function upsertKillEvent(kill: KillEvent, counters: SyncCounters): Promise<void> {
  try {
    const { data: existing, error: checkError } = await retryWithBackoff(
      async () => {
        return await supabase
          .from('kill_events')
          .select('id')
          .eq('eventId', kill.EventId)
          .maybeSingle();
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        onRetry: (attempt, error) => {
          console.warn(`[PvPSync] Retry ${attempt}/3 checking kill ${kill.EventId}:`, (error)?.message ?? error);
        },
      }
    );

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`[PvPSync] Check error for kill ${kill.EventId}:`, checkError);
    }

    if (existing) {
      counters.duplicates++;
      return;
    }

    const { error } = await retryWithBackoff(
      async () => {
        return await supabase.from('kill_events').insert({
          id: crypto.randomUUID(),
          eventId: kill.EventId,
          timestamp: new Date(kill.TimeStamp).toISOString(),
          killerId: kill.Killer.Id,
          killerName: kill.Killer.Name,
          killerGuildId: kill.Killer.GuildId || null,
          killerGuildName: kill.Killer.GuildName || null,
          killerAllianceId: kill.Killer.AllianceId || null,
          killerAllianceName: kill.Killer.AllianceName || null,
          killerItemPower: (kill.Killer as any).AverageItemPower || null,
          killerDamageDone: (kill.Killer as any).DamageDone || null,
          killerEquipment: (kill.Killer as any).Equipment || null,
          victimId: kill.Victim.Id,
          victimName: kill.Victim.Name,
          victimGuildId: kill.Victim.GuildId || null,
          victimGuildName: kill.Victim.GuildName || null,
          victimAllianceId: kill.Victim.AllianceId || null,
          victimAllianceName: kill.Victim.AllianceName || null,
          victimItemPower: (kill.Victim as any).AverageItemPower || null,
          victimEquipment: (kill.Victim as any).Equipment || null,
          victimInventory: (kill.Victim as any).Inventory || null,
          totalFame: kill.TotalVictimKillFame,
          location: kill.Location || null,
          numberOfParticipants: kill.numberOfParticipants || null,
          battleId: kill.BattleId || null,
          participants: kill.Participants || null,
          server: 'Americas',
          createdAt: new Date().toISOString(),
        });
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        onRetry: (attempt, error) => {
          console.warn(`[PvPSync] Retry ${attempt}/3 inserting kill ${kill.EventId}:`, (error)?.message ?? error);
        },
      }
    );

    if (error) {
      if (isDuplicateError(error)) {
        counters.duplicates++;
        return;
      }
      throw error;
    }

    counters.newKills++;
  } catch (error) {
    console.error(`[PvPSync] Error storing kill ${kill.EventId}:`, error);
    counters.errors++;
  }
}

async function updatePlayerStats(kill: KillEvent): Promise<void> {
  const killerUpdate = supabase
    .from('player_pvp_stats')
    .upsert({
      id: crypto.randomUUID(),
      playerId: kill.Killer.Id,
      playerName: kill.Killer.Name,
      guildId: kill.Killer.GuildId || null,
      guildName: kill.Killer.GuildName || null,
      allianceId: kill.Killer.AllianceId || null,
      allianceName: kill.Killer.AllianceName || null,
      totalKills: 1,
      totalDeaths: 0,
      totalFame: kill.TotalVictimKillFame,
      killFame: kill.TotalVictimKillFame,
      deathFame: 0,
      gamesPlayed: 1,
      lastSeenAt: new Date(kill.TimeStamp).toISOString(),
      lastKillAt: new Date(kill.TimeStamp).toISOString(),
      server: 'Americas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'playerId' });

  const victimUpdate = supabase
    .from('player_pvp_stats')
    .upsert({
      id: crypto.randomUUID(),
      playerId: kill.Victim.Id,
      playerName: kill.Victim.Name,
      guildId: kill.Victim.GuildId || null,
      guildName: kill.Victim.GuildName || null,
      allianceId: kill.Victim.AllianceId || null,
      allianceName: kill.Victim.AllianceName || null,
      totalKills: 0,
      totalDeaths: 1,
      totalFame: kill.TotalVictimKillFame,
      killFame: 0,
      deathFame: kill.TotalVictimKillFame,
      gamesPlayed: 1,
      lastSeenAt: new Date(kill.TimeStamp).toISOString(),
      lastDeathAt: new Date(kill.TimeStamp).toISOString(),
      server: 'Americas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'playerId' });

  await Promise.all([killerUpdate, victimUpdate]);
}

async function updateGuildStats(guildId: string, guildName: string, isKill: boolean): Promise<void> {
  const { data: existing } = await supabase
    .from('guild_pvp_stats')
    .select('*')
    .eq('guildId', guildId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('guild_pvp_stats')
      .update({
        guildName,
        totalKills: isKill ? existing.totalKills + 1 : existing.totalKills,
        totalDeaths: !isKill ? existing.totalDeaths + 1 : existing.totalDeaths,
        weeklyKills: isKill ? existing.weeklyKills + 1 : existing.weeklyKills,
        weeklyDeaths: !isKill ? existing.weeklyDeaths + 1 : existing.weeklyDeaths,
        monthlyKills: isKill ? existing.monthlyKills + 1 : existing.monthlyKills,
        monthlyDeaths: !isKill ? existing.monthlyDeaths + 1 : existing.monthlyDeaths,
        updatedAt: new Date().toISOString(),
      })
      .eq('guildId', guildId);
    return;
  }

  await supabase
    .from('guild_pvp_stats')
    .insert({
      id: crypto.randomUUID(),
      guildId,
      guildName,
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

async function processBattles(battles: Battle[], counters: SyncCounters): Promise<void> {
  for (const battle of battles) {
    try {
      const { data: existing } = await supabase
        .from('battles')
        .select('id')
        .eq('battleId', battle.id)
        .maybeSingle();

      if (existing) {
        counters.duplicates++;
        continue;
      }

      const playersA = battle.players?.a?.length || 0;
      const playersB = battle.players?.b?.length || 0;
      const totalPlayers = playersA + playersB;

      const { error } = await supabase.from('battles').insert({
        id: crypto.randomUUID(),
        battleId: battle.id,
        name: battle.name || null,
        startTime: new Date(battle.startTime).toISOString(),
        endTime: new Date(battle.endTime).toISOString(),
        totalKills: battle.totalKills,
        totalFame: battle.totalFame,
        totalPlayers,
        players: battle.players || null,
        server: 'Americas',
        createdAt: new Date().toISOString(),
      });

      if (error) {
        if (isDuplicateError(error)) {
          counters.duplicates++;
          continue;
        }
        throw error;
      }

      counters.newBattles++;
    } catch (error) {
      console.error(`[PvPSync] Battle error ${battle.id}:`, error);
      counters.errors++;
    }
  }
}

export async function syncPvpData(limit = 50): Promise<SyncCounters> {
  const counters: SyncCounters = {
    killsFetched: 0,
    battlesFetched: 0,
    newKills: 0,
    newBattles: 0,
    duplicates: 0,
    errors: 0,
  };

  const gi = getGameinfoClient('Americas');
  const [kills, battles] = await Promise.all([
    gi.getRecentKills(limit, 0),
    gi.getRecentBattles('day', 20, 0),
  ]);

  counters.killsFetched += kills.length;
  counters.battlesFetched += battles.length;

  for (const kill of kills) {
    await upsertKillEvent(kill, counters);
    await updatePlayerStats(kill);

    if (kill.Killer.GuildId) {
      await updateGuildStats(kill.Killer.GuildId, kill.Killer.GuildName || '', true);
    }

    if (kill.Victim.GuildId) {
      await updateGuildStats(kill.Victim.GuildId, kill.Victim.GuildName || '', false);
    }
  }

  await processBattles(battles, counters);

  return counters;
}
