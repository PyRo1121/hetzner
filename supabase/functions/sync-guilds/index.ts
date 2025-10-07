import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const GAMEINFO_BASE_URL =
  Deno.env.get("GAMEINFO_BASE_URL") ?? "https://gameinfo.albiononline.com/api/gameinfo";
const DEFAULT_SERVER = Deno.env.get("GAMEINFO_SERVER") ?? "Americas";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase credentials are not configured");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { "Content-Type": "application/json" } },
});

const GuildFameEntrySchema = z
  .object({
    GuildId: z.string(),
    GuildName: z.string(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    AllianceTag: z.string().optional().nullable(),
    Total: z.number().optional().nullable(),
    Rank: z.number().optional().nullable(),
  })
  .transform((value) => ({
    guildId: value.GuildId,
    guildName: value.GuildName,
    allianceId: value.AllianceId ?? null,
    allianceName: value.AllianceName ?? null,
    allianceTag: value.AllianceTag ?? null,
    total: value.Total ?? 0,
    rank: value.Rank ?? null,
  }));

type GuildFameEntry = z.infer<typeof GuildFameEntrySchema>;

const GuildSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    AllianceTag: z.string().optional().nullable(),
    MemberCount: z.number().optional().nullable(),
    killFame: z.number().optional().nullable(),
    DeathFame: z.number().optional().nullable(),
    AttacksWon: z.number().optional().nullable(),
    DefensesWon: z.number().optional().nullable(),
    Founded: z.string().optional().nullable(),
    FounderId: z.string().optional().nullable(),
    FounderName: z.string().optional().nullable(),
  })
  .transform((value) => ({
    guildId: value.Id,
    guildName: value.Name,
    allianceId: value.AllianceId ?? null,
    allianceName: value.AllianceName ?? null,
    allianceTag: value.AllianceTag ?? null,
    memberCount: value.MemberCount ?? null,
    killFame: value.killFame ?? 0,
    deathFame: value.DeathFame ?? 0,
    attacksWon: value.AttacksWon ?? 0,
    defensesWon: value.DefensesWon ?? 0,
    foundedAt: value.Founded ?? null,
    founderId: value.FounderId ?? null,
    founderName: value.FounderName ?? null,
  }));

type GuildProfile = z.infer<typeof GuildSchema>;

const GuildMemberSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    GuildId: z.string().optional().nullable(),
    GuildName: z.string().optional().nullable(),
    AllianceId: z.string().optional().nullable(),
    AllianceName: z.string().optional().nullable(),
    Role: z.string().optional().nullable(),
    KillFame: z.number().optional().nullable(),
    DeathFame: z.number().optional().nullable(),
    FameRatio: z.number().optional().nullable(),
    AverageItemPower: z.number().optional().nullable(),
    JoinDate: z.string().optional().nullable(),
  })
  .transform((value) => ({
    playerId: value.Id,
    playerName: value.Name,
    guildId: value.GuildId ?? null,
    guildName: value.GuildName ?? null,
    allianceId: value.AllianceId ?? null,
    allianceName: value.AllianceName ?? null,
    role: value.Role ?? null,
    killFame: value.KillFame ?? 0,
    deathFame: value.DeathFame ?? 0,
    fameRatio: value.FameRatio ?? null,
    averageItemPower: value.AverageItemPower ?? null,
    joinDate: value.JoinDate ?? null,
  }));

type GuildMember = z.infer<typeof GuildMemberSchema>;

const GuildEventSchema = z
  .object({
    EventId: z.number(),
    TimeStamp: z.string(),
    TotalVictimKillFame: z.number(),
    Location: z.string().optional().nullable(),
    Killer: z
      .object({
        GuildId: z.string().optional().nullable(),
        GuildName: z.string().optional().nullable(),
        AllianceId: z.string().optional().nullable(),
        AllianceName: z.string().optional().nullable(),
      })
      .optional(),
    Victim: z
      .object({
        GuildId: z.string().optional().nullable(),
        GuildName: z.string().optional().nullable(),
        AllianceId: z.string().optional().nullable(),
        AllianceName: z.string().optional().nullable(),
      })
      .optional(),
    BattleId: z.number().optional().nullable(),
  })
  .strict();

type GuildEvent = z.infer<typeof GuildEventSchema>;

async function fetchJson<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${url}`);
  }
  const data = await response.json();
  return schema.parse(data);
}

async function fetchGuildProfile(guildId: string): Promise<GuildProfile> {
  return await fetchJson(`${GAMEINFO_BASE_URL}/guilds/${guildId}`, GuildSchema);
}

async function fetchGuildMembers(guildId: string): Promise<GuildMember[]> {
  const raw = await fetchJson(
    `${GAMEINFO_BASE_URL}/guilds/${guildId}/members`,
    z.array(GuildMemberSchema),
  );
  return raw;
}

async function fetchGuildFameLeaderboard(range: string): Promise<GuildFameEntry[]> {
  const raw = await fetchJson(
    `${GAMEINFO_BASE_URL}/events/guildfame?range=${range}&limit=50&offset=0`,
    z.array(GuildFameEntrySchema),
  );
  return raw;
}

async function fetchGuildEvents(guildId: string): Promise<GuildEvent[]> {
  return await fetchJson(
    `${GAMEINFO_BASE_URL}/events?guildId=${guildId}&limit=25`,
    z.array(GuildEventSchema),
  );
}

async function upsertGuildSnapshot(profile: GuildProfile): Promise<void> {
  await supabase.from("guild_snapshots").insert({
    guild_id: profile.guildId,
    guild_name: profile.guildName,
    alliance_id: profile.allianceId,
    alliance_name: profile.allianceName,
    alliance_tag: profile.allianceTag,
    member_count: profile.memberCount,
    kill_fame: profile.killFame,
    death_fame: profile.deathFame,
    attacks_won: profile.attacksWon,
    defenses_won: profile.defensesWon,
    fame_ratio:
      profile.killFame && profile.deathFame && profile.deathFame > 0
        ? profile.killFame / profile.deathFame
        : null,
    server: DEFAULT_SERVER,
  });
}

async function refreshGuildMembers(guildId: string, guildName: string, members: GuildMember[]): Promise<void> {
  const capturedAt = new Date().toISOString();
  if (members.length === 0) return;

  await supabase.from("guild_members").insert(
    members.map((member) => ({
      guild_id: guildId,
      guild_name: guildName,
      player_id: member.playerId,
      player_name: member.playerName,
      alliance_id: member.allianceId,
      alliance_name: member.allianceName,
      role: member.role,
      join_date: member.joinDate,
      kill_fame: member.killFame,
      death_fame: member.deathFame,
      fame_ratio: member.fameRatio,
      average_item_power: member.averageItemPower,
      captured_at: capturedAt,
      server: DEFAULT_SERVER,
    })),
  );
}

async function upsertGuildRankings(metric: string, range: string, entries: GuildFameEntry[]): Promise<void> {
  const capturedAt = new Date().toISOString();
  if (entries.length === 0) return;

  await supabase.from("guild_rankings").insert(
    entries.map((entry) => ({
      guild_id: entry.guildId,
      guild_name: entry.guildName,
      alliance_id: entry.allianceId,
      alliance_name: entry.allianceName,
      metric,
      range,
      rank: entry.rank,
      value: entry.total,
      captured_at: capturedAt,
      server: DEFAULT_SERVER,
    })),
    { upsert: false },
  );
}

async function recordGuildBattles(guildId: string, guildName: string): Promise<void> {
  try {
    const events = await fetchGuildEvents(guildId);
    const battleMap = new Map<number, { fame: number; kills: number; deaths: number; zones: Set<string> }>();

    for (const event of events) {
      if (!event.BattleId) continue;
      const existing = battleMap.get(event.BattleId) ?? {
        fame: 0,
        kills: 0,
        deaths: 0,
        zones: new Set<string>(),
      };

      existing.fame += event.TotalVictimKillFame;
      if (event.Killer?.GuildId === guildId) existing.kills += 1;
      if (event.Victim?.GuildId === guildId) existing.deaths += 1;
      if (event.Location) existing.zones.add(event.Location);
      battleMap.set(event.BattleId, existing);
    }

    if (battleMap.size === 0) return;

    const capturedAt = new Date().toISOString();
    const inserts = Array.from(battleMap.entries()).map(([battleId, summary]) => ({
      guild_id: guildId,
      guild_name: guildName,
      battle_id: battleId,
      total_fame: summary.fame,
      total_kills: summary.kills,
      total_deaths: summary.deaths,
      zone: summary.zones.size > 0 ? Array.from(summary.zones).join(", ") : null,
      server: DEFAULT_SERVER,
      captured_at: capturedAt,
    }));

    await supabase.from("guild_battles").insert(inserts, { upsert: false });
  } catch (error) {
    console.error(`[sync-guilds] Failed to record battles for guild ${guildId}`, error);
  }
}

interface SyncStats {
  guildsProcessed: number;
  membersInserted: number;
  rankingsInserted: number;
  battlesRecorded: number;
  errors: number;
}

async function processGuild(guildId: string, stats: SyncStats): Promise<void> {
  try {
    const profile = await fetchGuildProfile(guildId);
    await upsertGuildSnapshot(profile);

    const members = await fetchGuildMembers(guildId);
    await refreshGuildMembers(guildId, profile.guildName, members);
    stats.membersInserted += members.length;

    await recordGuildBattles(guildId, profile.guildName);
    stats.battlesRecorded += 1;
    stats.guildsProcessed += 1;
  } catch (error) {
    stats.errors += 1;
    console.error(`[sync-guilds] Guild processing failed for ${guildId}`, error);
  }
}

serve(async (req) => {
  if (CRON_SECRET) {
    const authorization = req.headers.get("authorization");
    if (authorization !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const stats: SyncStats = {
    guildsProcessed: 0,
    membersInserted: 0,
    rankingsInserted: 0,
    battlesRecorded: 0,
    errors: 0,
  };

  try {
    const ranges = ["day", "week", "month"];
    const leaderboardPromises = ranges.map((range) => fetchGuildFameLeaderboard(range));
    const leaderboards = await Promise.all(leaderboardPromises);

    for (let i = 0; i < ranges.length; i += 1) {
      await upsertGuildRankings("kill_fame", ranges[i], leaderboards[i]);
      stats.rankingsInserted += leaderboards[i].length;
    }

    const uniqueGuilds = new Set<string>();
    for (const leaderboard of leaderboards) {
      for (const entry of leaderboard) {
        uniqueGuilds.add(entry.guildId);
      }
    }

    const queue = Array.from(uniqueGuilds.values()).slice(0, 40); // safety limit per run
    await Promise.all(queue.map((guildId) => processGuild(guildId, stats)));

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        processedGuilds: queue.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    stats.errors += 1;
    console.error("[sync-guilds] sync failure", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stats,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
