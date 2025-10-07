/**
 * Guild API Client
 * Fetches guild data from Gameinfo API
 */

import { z } from 'zod';

const BASE_URL = 'https://gameinfo.albiononline.com/api/gameinfo';

// Guild member schema
const GuildMemberSchema = z.object({
  Id: z.string(),
  Name: z.string(),
  GuildId: z.string().optional(),
  GuildName: z.string().optional(),
  AllianceId: z.string().optional(),
  AllianceName: z.string().optional(),
  Avatar: z.string().optional(),
  AvatarRing: z.string().optional(),
  KillFame: z.number().optional(),
  DeathFame: z.number().optional(),
  FameRatio: z.number().optional(),
  totalKills: z.number().optional(),
  gvgKills: z.number().optional(),
  gvgWon: z.number().optional(),
});

// Guild schema
const GuildSchema = z.object({
  Id: z.string(),
  Name: z.string(),
  AllianceId: z.string().nullable().optional(),
  AllianceName: z.string().nullable().optional(),
  AllianceTag: z.string().nullable().optional(),
  FounderId: z.string().optional(),
  FounderName: z.string().optional(),
  Founded: z.string().optional(),
  MemberCount: z.number().optional(),
  killFame: z.number().optional(),
  DeathFame: z.number().optional(),
  AttacksWon: z.number().optional(),
  DefensesWon: z.number().optional(),
});

export type GuildMember = z.infer<typeof GuildMemberSchema>;
export type Guild = z.infer<typeof GuildSchema>;

/**
 * Search for guilds by name
 */
export async function searchGuilds(query: string): Promise<{ guilds: Guild[] }> {
  if (!query || query.length < 2) {
    return { guilds: [] };
  }

  try {
    const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Guild search failed: ${response.status}`);
    }

    const data = await response.json();

    // Filter for guilds only
    const guilds = (data.guilds ?? [])
      .map((guild: any) => {
        const parsed = GuildSchema.safeParse(guild);
        return parsed.success ? parsed.data : null;
      })
      .filter(Boolean);

    return { guilds };
  } catch (error) {
    console.error('Guild search error:', error);
    return { guilds: [] };
  }
}

/**
 * Get guild details by ID
 */
export async function getGuildById(guildId: string): Promise<Guild | null> {
  try {
    const response = await fetch(`${BASE_URL}/guilds/${guildId}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Guild fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const parsed = GuildSchema.safeParse(data);

    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error('Guild fetch error:', error);
    return null;
  }
}

/**
 * Get guild members
 */
export async function getGuildMembers(guildId: string): Promise<GuildMember[]> {
  try {
    const response = await fetch(`${BASE_URL}/guilds/${guildId}/members`, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      throw new Error(`Guild members fetch failed: ${response.status}`);
    }

    const data = await response.json();

    const members = (Array.isArray(data) ? data : [])
      .map((member: any) => {
        const parsed = GuildMemberSchema.safeParse(member);
        return parsed.success ? parsed.data : null;
      })
      .filter((m): m is GuildMember => m !== null);

    return members;
  } catch (error) {
    console.error('Guild members fetch error:', error);
    return [];
  }
}

/**
 * Get guild statistics from recent battles
 */
export async function getGuildStats(guildId: string): Promise<{
  totalKills: number;
  totalDeaths: number;
  killFame: number;
  deathFame: number;
  kdRatio: number;
  recentBattles: number;
}> {
  try {
    // Fetch recent events involving this guild
    const response = await fetch(`${BASE_URL}/events?guildId=${guildId}&limit=51`, {
      // Fixed: API limit is 51
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Guild stats fetch failed: ${response.status}`);
    }

    const events = await response.json();

    let totalKills = 0;
    let totalDeaths = 0;
    let killFame = 0;
    let deathFame = 0;

    for (const event of events) {
      if (event.Killer?.GuildId === guildId) {
        totalKills++;
        killFame += event.TotalVictimKillFame ?? 0;
      }
      if (event.Victim?.GuildId === guildId) {
        totalDeaths++;
        deathFame += event.TotalVictimKillFame ?? 0;
      }
    }

    const kdRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;

    return {
      totalKills,
      totalDeaths,
      killFame,
      deathFame,
      kdRatio,
      recentBattles: events.length,
    };
  } catch (error) {
    console.error('Guild stats error:', error);
    return {
      totalKills: 0,
      totalDeaths: 0,
      killFame: 0,
      deathFame: 0,
      kdRatio: 0,
      recentBattles: 0,
    };
  }
}

/**
 * Get top guilds by kill fame
 */
export async function getTopGuilds(limit: number = 20): Promise<Guild[]> {
  try {
    // This would ideally use a dedicated leaderboard endpoint
    // For now, we'll use search with common guild names as a fallback
    const commonPrefixes = ['A', 'B', 'C', 'D', 'E'];
    const allGuilds: Guild[] = [];

    for (const prefix of commonPrefixes) {
      const { guilds } = await searchGuilds(prefix);
      allGuilds.push(...guilds);
    }

    // Remove duplicates and sort by kill fame
    const uniqueGuilds = Array.from(new Map(allGuilds.map((g) => [g.Id, g])).values());

    return uniqueGuilds.sort((a, b) => (b.killFame ?? 0) - (a.killFame ?? 0)).slice(0, limit);
  } catch (error) {
    console.error('Top guilds fetch error:', error);
    return [];
  }
}

/**
 * Compare two guilds
 */
export async function compareGuilds(
  guildId1: string,
  guildId2: string
): Promise<{
  guild1: Guild | null;
  guild2: Guild | null;
  stats1: Awaited<ReturnType<typeof getGuildStats>>;
  stats2: Awaited<ReturnType<typeof getGuildStats>>;
}> {
  const [guild1, guild2, stats1, stats2] = await Promise.all([
    getGuildById(guildId1),
    getGuildById(guildId2),
    getGuildStats(guildId1),
    getGuildStats(guildId2),
  ]);

  return { guild1, guild2, stats1, stats2 };
}
