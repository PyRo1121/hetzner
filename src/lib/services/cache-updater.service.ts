/**
 * Cache Updater Service
 * Updates aggregation cache tables for fast API responses
 * Run this periodically (every 5-10 minutes) via cron or background job
 */

import { supabase } from '@/backend/supabase/clients';

import { itemsService } from './items.service';

class CacheUpdaterService {
  private static instance: CacheUpdaterService;
  private isUpdating = false;

  private constructor() {}

  public static getInstance(): CacheUpdaterService {
    if (!CacheUpdaterService.instance) {
      CacheUpdaterService.instance = new CacheUpdaterService();
    }
    return CacheUpdaterService.instance;
  }

  /**
   * Update PVP stats cache (total kills, active players, etc.)
   */
  async updatePvpStatsCache(): Promise<void> {
    if (this.isUpdating) {
      console.log('[CacheUpdater] Already updating, skipping...');
      return;
    }

    this.isUpdating = true;

    try {
      console.log('[CacheUpdater] Updating PVP stats cache...');

      // Get total kills
      const { count: totalKills } = await supabase
        .from('kill_events')
        .select('*', { count: 'exact', head: true });

      // Get active players (last 7 days)
      const { data: recentKills } = await supabase
        .from('kill_events')
        .select('killerId')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10000);

      const uniquePlayers = new Set(recentKills?.map(k => k.killerId) || []);

      // Get total fame
      const { data: fameData } = await supabase
        .from('kill_events')
        .select('totalFame')
        .limit(1000);

      const totalFame = fameData?.reduce((sum, k) => sum + (k.totalFame || 0), 0) || 0;

      // Get meta builds count
      const { count: metaBuildsCount } = await supabase
        .from('meta_builds_cache')
        .select('*', { count: 'exact', head: true });

      // Update cache
      await supabase.from('pvp_stats_cache').upsert([
        { stat_key: 'total_kills', stat_value: totalKills || 0, last_updated: new Date().toISOString() },
        { stat_key: 'active_players', stat_value: uniquePlayers.size, last_updated: new Date().toISOString() },
        { stat_key: 'total_fame', stat_value: totalFame, last_updated: new Date().toISOString() },
        { stat_key: 'meta_builds_count', stat_value: metaBuildsCount || 0, last_updated: new Date().toISOString() },
      ], { onConflict: 'stat_key' });

      console.log('[CacheUpdater] PVP stats cache updated successfully');
    } catch (error) {
      console.error('[CacheUpdater] Failed to update PVP stats cache:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update meta builds cache (aggregated build stats)
   * This is the heavy operation that was taking 4+ minutes
   */
  async updateMetaBuildsCache(): Promise<void> {
    try {
      console.log('[CacheUpdater] Updating meta builds cache...');
      const startTime = Date.now();

      // Get recent kills (last 30 days, limit to 5000 for performance)
      const { data: kills } = await supabase
        .from('kill_events')
        .select('killerEquipment, victimEquipment, totalFame')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(5000);

      if (!kills || kills.length === 0) {
        console.log('[CacheUpdater] No kills found');
        return;
      }

      // Aggregate builds
      const buildMap = new Map<string, any>();

      for (const kill of kills) {
        // Process killer build
        if (kill.killerEquipment) {
          const equipment = kill.killerEquipment;
          const buildId = this.generateBuildId(equipment);
          
          if (buildId) {
            if (!buildMap.has(buildId)) {
              buildMap.set(buildId, {
                build_id: buildId,
                weapon_type: equipment.MainHand?.Type,
                weapon_base: this.stripEnchantment(equipment.MainHand?.Type),
                head_type: equipment.Head?.Type,
                head_base: this.stripEnchantment(equipment.Head?.Type),
                armor_type: equipment.Armor?.Type,
                armor_base: this.stripEnchantment(equipment.Armor?.Type),
                shoes_type: equipment.Shoes?.Type,
                shoes_base: this.stripEnchantment(equipment.Shoes?.Type),
                cape_type: equipment.Cape?.Type,
                cape_base: this.stripEnchantment(equipment.Cape?.Type),
                kills: 0,
                deaths: 0,
                total_fame: 0,
              });
            }
            const build = buildMap.get(buildId);
            build.kills++;
            build.total_fame += kill.totalFame || 0;
          }
        }

        // Process victim build (for deaths)
        if (kill.victimEquipment) {
          const equipment = kill.victimEquipment;
          const buildId = this.generateBuildId(equipment);
          
          if (buildId) {
            if (!buildMap.has(buildId)) {
              buildMap.set(buildId, {
                build_id: buildId,
                weapon_type: equipment.MainHand?.Type,
                weapon_base: this.stripEnchantment(equipment.MainHand?.Type),
                head_type: equipment.Head?.Type,
                head_base: this.stripEnchantment(equipment.Head?.Type),
                armor_type: equipment.Armor?.Type,
                armor_base: this.stripEnchantment(equipment.Armor?.Type),
                shoes_type: equipment.Shoes?.Type,
                shoes_base: this.stripEnchantment(equipment.Shoes?.Type),
                cape_type: equipment.Cape?.Type,
                cape_base: this.stripEnchantment(equipment.Cape?.Type),
                kills: 0,
                deaths: 0,
                total_fame: 0,
              });
            }
            const build = buildMap.get(buildId);
            build.deaths++;
          }
        }
      }

      // Calculate stats and get localized names
      const builds = Array.from(buildMap.values())
        .filter(b => (b.kills + b.deaths) >= 5) // Minimum sample size
        .slice(0, 100); // Top 100 builds

      // Resolve localized names
      for (const build of builds) {
        if (build.weapon_base) {
          const item = await itemsService.getById(build.weapon_base);
          build.weapon_name = item ? itemsService.getLocalizedName(item) : build.weapon_base;
        }
        if (build.head_base) {
          const item = await itemsService.getById(build.head_base);
          build.head_name = item ? itemsService.getLocalizedName(item) : build.head_base;
        }
        if (build.armor_base) {
          const item = await itemsService.getById(build.armor_base);
          build.armor_name = item ? itemsService.getLocalizedName(item) : build.armor_base;
        }
        if (build.shoes_base) {
          const item = await itemsService.getById(build.shoes_base);
          build.shoes_name = item ? itemsService.getLocalizedName(item) : build.shoes_base;
        }
        if (build.cape_base) {
          const item = await itemsService.getById(build.cape_base);
          build.cape_name = item ? itemsService.getLocalizedName(item) : build.cape_base;
        }

        // Calculate derived stats
        const sampleSize = build.kills + build.deaths;
        build.sample_size = sampleSize;
        build.win_rate = sampleSize > 0 ? (build.kills / sampleSize) * 100 : 0;
        build.popularity = (sampleSize / kills.length) * 100;
        build.avg_fame = build.kills > 0 ? build.total_fame / build.kills : 0;
        build.last_updated = new Date().toISOString();
      }

      // Clear old cache and insert new data
      await supabase.from('meta_builds_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (builds.length > 0) {
        await supabase.from('meta_builds_cache').insert(builds);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[CacheUpdater] Meta builds cache updated successfully in ${duration}s (${builds.length} builds)`);
    } catch (error) {
      console.error('[CacheUpdater] Failed to update meta builds cache:', error);
    }
  }

  /**
   * Update all caches
   */
  async updateAllCaches(): Promise<void> {
    await this.updatePvpStatsCache();
    await this.updateMetaBuildsCache();
  }

  private generateBuildId(equipment: any): string | null {
    const weapon = equipment.MainHand?.Type;
    const head = equipment.Head?.Type;
    const armor = equipment.Armor?.Type;
    const shoes = equipment.Shoes?.Type;

    if (!weapon || !head || !armor || !shoes) {
      return null;
    }

    return `${weapon}_${head}_${armor}_${shoes}`;
  }

  private stripEnchantment(itemType: string | undefined): string | undefined {
    if (!itemType) {return undefined;}
    return itemType.replace(/_LEVEL\d+@\d+$/, '').replace(/@\d+$/, '');
  }
}

export const cacheUpdaterService = CacheUpdaterService.getInstance();
