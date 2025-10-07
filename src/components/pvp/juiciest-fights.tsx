'use client';

import { useEffect, useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  MapPin,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';

import { EquipmentDisplay, type Equipment } from '@/components/pvp/equipment-display';
import { Dialog, DialogContent } from '@/components/ui/dialog';
// Import the hook directly to avoid the hooks barrel which pulls server-only services
import { useLootValue } from '@/hooks/use-loot-value';
import type { EquipmentItem, KillEvent, Player } from '@/lib/api/gameinfo/client';
// Import the items service directly to avoid pulling in server-only services via the index
import { itemsService } from '@/lib/services/items.service';
import { supabase } from '@/backend/supabase/clients';

interface LootEntry {
  uniqueName: string;
  count: number;
  estimatedUnitValue: number;
  estimatedTotalValue: number;
}
interface EnrichedKillEvent extends KillEvent {
  EstimatedLootValue?: {
    totalSilver: number;
    entries: LootEntry[];
  };
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatSilver(amount: number): string {
  if (amount <= 0) {
    return '—';
  }
  return `${compactFormatter.format(amount)} silver`;
}

function formatTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) {
    const remainingMinutes = diffMinutes % 60;
    return `${hours}h ${remainingMinutes}m ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatItemId(id?: string | null): string {
  if (!id) {
    return 'Unknown';
  }
  return id
    .replace(/^T\d+_/, '')
    .replace(/@\d+$/, '')
    .replace(/^MAIN_|^2H_|^OFF_/, '')
    .replace(/^ARMOR_|^HEAD_|^SHOES_|^CAPE_?/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const PAGE_SIZE = 15;
const INITIAL_FETCH_LIMIT = 90;

export function JuiciestFights() {
  const [fights, setFights] = useState<EnrichedKillEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFight, setSelectedFight] = useState<EnrichedKillEvent | null>(null);
  const [filter, setFilter] = useState<'all' | 'solo' | 'group'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);

        // Query via API for proper data structure
        const response = await fetch(`/api/pvp/kills?limit=${INITIAL_FETCH_LIMIT}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          const enrichedFights = result.data
            .map((fight: KillEvent) => ({
              ...fight,
            }))
            // Sort by TotalVictimKillFame in descending order to show "juiciest" fights first
            .sort(
              (a: EnrichedKillEvent, b: EnrichedKillEvent) =>
                b.TotalVictimKillFame - a.TotalVictimKillFame
            );
          setFights(enrichedFights);
        } else {
          setFights([]);
        }
      } catch (error) {
        console.error('Failed to load juiciest fights:', error);
        setFights([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();

    // Subscribe to real-time updates with debounce
    let reloadTimeout: NodeJS.Timeout;
    const channel = supabase
      .channel('kill_events_juicy_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kill_events' }, () => {
        // Debounce reloads to prevent spam
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          void loadInitialData();
        }, 3000); // Wait 3s before reloading
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredFights = useMemo(() => {
    return fights.filter((fight) => {
      const participants = fight.numberOfParticipants ?? 1;
      if (filter === 'solo') {
        return participants === 1;
      }
      if (filter === 'group') {
        return participants > 1;
      }
      return true;
    });
  }, [fights, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(filteredFights.length / PAGE_SIZE));
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [filteredFights.length, currentPage]);

  const paginatedFights = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFights.slice(start, start + PAGE_SIZE);
  }, [filteredFights, currentPage]);

  const pageCount = Math.max(1, Math.ceil(filteredFights.length / PAGE_SIZE));
  const showingStart = filteredFights.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(filteredFights.length, currentPage * PAGE_SIZE);

  const totalFame = fights.reduce((sum, fight) => sum + (fight.TotalVictimKillFame || 0), 0);
  const avgFame = fights.length > 0 ? Math.round(totalFame / fights.length) : 0;
  // Loot value calculated on-demand when modal opens
  const totalHaul = 0; // Not calculated upfront for performance

  if (isLoading) {
    return (
      <div className="panel-float">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-albion-gray-800" />
          <div className="h-96 rounded bg-albion-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="panel-float space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-neon-orange/20 rounded-lg p-3">
            <Trophy className="text-neon-orange h-7 w-7" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Juiciest Fights</h3>
            <p className="text-albion-gray-400 text-sm">
              {filteredFights.length} curated kills • Showing {showingStart}-{showingEnd} • Total{' '}
              {compactFormatter.format(totalFame)} fame • Avg {compactFormatter.format(avgFame)}{' '}
              fame • {formatSilver(totalHaul)} seized
            </p>
          </div>
        </div>

        <div className="bg-albion-gray-850/90 rounded-lg p-2 backdrop-blur">
          <div className="flex gap-2">
            {(['all', 'solo', 'group'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  filter === value
                    ? 'bg-neon-orange shadow-neon text-black'
                    : 'text-albion-gray-300 hover:text-white'
                }`}
              >
                {value === 'all' ? 'All Kills' : null}
                {value === 'solo' ? '1v1 Clashes' : null}
                {value === 'group' ? 'Group Ambushes' : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {paginatedFights.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-albion-gray-800 bg-albion-gray-900/70 p-12 text-center text-albion-gray-500">
            No fights match this filter yet. Check back soon for fresh carnage.
          </div>
        ) : null}
        {paginatedFights.map((fight, index) => {
          const weapon = formatItemId(fight.Killer.Equipment?.MainHand?.Type);
          const victimWeapon = formatItemId(fight.Victim.Equipment?.MainHand?.Type);
          const absoluteRank = (currentPage - 1) * PAGE_SIZE + index + 1;

          return (
            <motion.button
              key={fight.EventId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedFight(fight)}
              className="to-albion-gray-950 hover:border-neon-orange/50 hover:shadow-neon group relative overflow-hidden rounded-2xl border border-albion-gray-800 bg-gradient-to-br from-albion-gray-900/90 via-albion-gray-900 p-5 text-left transition-shadow"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,138,76,0.15),_transparent_60%)]" />
              </div>

              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-albion-gray-500">
                    <span className="bg-neon-orange/10 text-neon-orange rounded-full px-2 py-1">
                      #{absoluteRank}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTimeAgo(fight.TimeStamp)}
                    </span>
                    {fight.Location ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {fight.Location}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-base font-semibold text-white">
                      <span className="max-w-[12rem] truncate">{fight.Killer.Name}</span>
                      <Swords className="h-4 w-4 text-neon-red" />
                      <span className="text-albion-gray-300 max-w-[12rem] truncate">
                        {fight.Victim.Name}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-albion-gray-500">
                      <span className="flex items-center gap-1">
                        <Flame className="text-neon-orange h-3 w-3" /> {weapon}
                      </span>
                      <span className="text-albion-gray-600">vs</span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-neon-blue" /> {victimWeapon}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-albion-gray-500">
                    {fight.Killer.GuildName ? (
                      <span className="rounded-full bg-neon-blue/10 px-3 py-1 text-neon-blue">
                        {fight.Killer.GuildName}
                        {fight.Killer.AllianceName ? ` · ${fight.Killer.AllianceName}` : ''}
                      </span>
                    ) : null}
                    {fight.Victim.GuildName ? (
                      <span className="rounded-full bg-neon-red/10 px-3 py-1 text-neon-red">
                        {fight.Victim.GuildName}
                        {fight.Victim.AllianceName ? ` · ${fight.Victim.AllianceName}` : ''}
                      </span>
                    ) : null}
                    {fight.numberOfParticipants && fight.numberOfParticipants > 1 ? (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {fight.numberOfParticipants} players
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> Duel
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="rounded-lg bg-albion-gray-900/70 px-3 py-2">
                    <p className="text-[0.7rem] uppercase tracking-wide text-albion-gray-500">
                      Kill Fame
                    </p>
                    <p className="text-neon-orange text-2xl font-bold">
                      {numberFormatter.format(fight.TotalVictimKillFame)}
                    </p>
                  </div>
                  {/* Loot value shown in modal only for performance */}
                </div>
              </div>

              <div className="via-neon-orange/60 mt-6 h-[2px] w-full bg-gradient-to-r from-transparent to-transparent opacity-60" />

              <div className="relative mt-6 flex items-center gap-4 text-xs text-albion-gray-500">
                <Sparkles className="text-neon-orange h-4 w-4" />
                <p>
                  Legendary clash analysed with full gear & loot breakdown. Tap to reveal cinematic
                  replay with market valuation.
                </p>
              </div>
            </motion.button>
          );
        })}
      </section>

      <section className="border-albion-gray-850/60 text-albion-gray-300 flex items-center justify-between rounded-2xl border bg-albion-gray-900/70 px-4 py-3 text-sm">
        <div>
          Page {currentPage} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="text-albion-gray-400 hover:border-neon-orange/40 disabled:border-albion-gray-850 flex items-center gap-1 rounded-lg border border-albion-gray-800 bg-albion-gray-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-albion-gray-600"
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <div className="text-albion-gray-400 flex items-center gap-1 text-xs font-semibold">
            {Array.from({ length: pageCount })
              .slice(0, 5)
              .map((_, idx) => {
                const pageNumber = idx + Math.max(1, Math.min(currentPage - 2, pageCount - 4));
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-[2.25rem] rounded-md px-2 py-1 transition-colors ${
                      isActive
                        ? 'bg-neon-orange shadow-neon text-black'
                        : 'text-albion-gray-400 hover:border-neon-orange/30 border border-transparent hover:text-white'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            {pageCount > 5 && currentPage < pageCount - 1 ? (
              <span className="px-1 text-albion-gray-600">…</span>
            ) : null}
            {pageCount > 5 ? (
              <button
                onClick={() => setCurrentPage(pageCount)}
                className={`min-w-[2.25rem] rounded-md px-2 py-1 transition-colors ${
                  currentPage === pageCount
                    ? 'bg-neon-orange shadow-neon text-black'
                    : 'text-albion-gray-400 hover:border-neon-orange/30 border border-transparent hover:text-white'
                }`}
              >
                {pageCount}
              </button>
            ) : null}
          </div>
          <button
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            className="text-albion-gray-400 hover:border-neon-orange/40 disabled:border-albion-gray-850 flex items-center gap-1 rounded-lg border border-albion-gray-800 bg-albion-gray-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-albion-gray-600"
            disabled={currentPage === pageCount}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <Dialog open={!!selectedFight} onOpenChange={() => setSelectedFight(null)}>
        <DialogContent className="border-neon-orange/30 bg-albion-gray-950/95 !mx-auto max-h-[95vh] w-[95vw] !max-w-7xl overflow-hidden border text-white backdrop-blur sm:rounded-lg">
          {selectedFight ? (
            <div className="h-full overflow-y-auto pr-2">
              <FightModal fight={selectedFight} onClose={() => setSelectedFight(null)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FightModalProps {
  fight: EnrichedKillEvent;
  onClose: () => void;
}

function FightModal({ fight }: FightModalProps) {
  const [lootNames, setLootNames] = useState<Map<string, string>>(new Map());

  // Calculate loot value on-demand when modal opens
  const inventory =
    fight.Victim.Inventory?.filter((item): item is NonNullable<typeof item> => item !== null) ?? [];
  const { data: loot, isLoading: lootLoading } = useLootValue(inventory, true);
  const lootEntries = useMemo(() => loot?.entries ?? [], [loot?.entries]);

  // Load localized names for loot items
  useEffect(() => {
    async function loadLootNames() {
      if (!lootEntries.length) {
        return;
      }

      const names = new Map<string, string>();
      for (const entry of lootEntries) {
        try {
          const item = await itemsService.getById(entry.uniqueName);
          if (item) {
            const localizedName = itemsService.getLocalizedName(item);
            names.set(entry.uniqueName, localizedName);
          }
        } catch {
          // Use formatted ID as fallback
          names.set(entry.uniqueName, formatItemId(entry.uniqueName));
        }
      }
      setLootNames(names);
    }

    void loadLootNames();
  }, [lootEntries]);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-albion-gray-800 pb-3">
        <div className="flex items-center gap-3">
          <Sparkles className="text-neon-orange h-5 w-5" />
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              {fight.Killer.Name}
              <Swords className="h-4 w-4 text-neon-red" />
              {fight.Victim.Name}
            </h2>
            <p className="text-xs text-albion-gray-500">
              {new Date(fight.TimeStamp).toLocaleString()} • {fight.Location ?? 'Unknown'} •{' '}
              {fight.numberOfParticipants ?? 1} participants
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-albion-gray-500">Fame</p>
            <p className="text-neon-orange text-xl font-bold">
              {compactFormatter.format(fight.TotalVictimKillFame)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-albion-gray-500">Loot Value</p>
            <p className="text-xl font-bold text-neon-green">
              {lootLoading ? '...' : formatSilver(loot?.totalSilver ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Victor Equipment */}
        <CombatantPanel
          title="Victor"
          accentColor="green"
          icon={<Trophy className="h-4 w-4 text-neon-green" />}
          player={fight.Killer}
          inventory={null}
        />

        {/* Fallen Equipment */}
        <CombatantPanel
          title="Fallen"
          accentColor="red"
          icon={<Skull className="h-4 w-4 text-neon-red" />}
          player={fight.Victim}
          inventory={fight.Victim.Inventory}
        />

        {/* Loot & Participants */}
        <div className="space-y-3">
          <section className="rounded-xl border border-albion-gray-800 bg-albion-gray-900/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neon-green">Loot Dropped</h3>
              <span className="text-xs text-albion-gray-500">
                {lootLoading ? 'Loading...' : `${lootEntries.length} items`}
              </span>
            </div>
            <div className="max-h-[400px] space-y-1 overflow-y-auto">
              {lootEntries.map((entry) => {
                const itemName = lootNames.get(entry.uniqueName) ?? formatItemId(entry.uniqueName);
                return (
                  <div
                    key={`${entry.uniqueName}-${entry.estimatedUnitValue}`}
                    className="group relative flex items-center justify-between gap-2 rounded border border-albion-gray-800 bg-albion-gray-900/60 px-2 py-1.5 transition-colors hover:bg-albion-gray-800/80"
                    title={itemName}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-xs text-white">{itemName}</span>
                      <span className="whitespace-nowrap text-xs text-albion-gray-500">
                        x{entry.count}
                      </span>
                    </div>
                    <span className="ml-2 whitespace-nowrap text-xs text-neon-green">
                      {formatSilver(entry.estimatedTotalValue)}
                    </span>

                    {/* Hover tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 hidden -translate-x-1/2 group-hover:block">
                      <div className="bg-albion-gray-950 whitespace-nowrap rounded-lg border-2 border-neon-blue px-4 py-3 shadow-2xl">
                        <p className="mb-1 text-sm font-bold text-white">{itemName}</p>
                        <p className="text-albion-gray-400 text-xs">
                          Quantity: <span className="font-semibold text-white">{entry.count}</span>
                        </p>
                        <p className="text-albion-gray-400 text-xs">
                          Value:{' '}
                          <span className="font-semibold text-neon-green">
                            {formatSilver(entry.estimatedTotalValue)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {lootLoading ? (
                <p className="bg-albion-gray-850/80 rounded-lg px-3 py-4 text-center text-sm text-albion-gray-500">
                  Calculating loot value...
                </p>
              ) : lootEntries.length === 0 ? (
                <p className="bg-albion-gray-850/80 rounded-lg px-3 py-4 text-center text-sm text-albion-gray-500">
                  No loot data was recorded for this kill.
                </p>
              ) : null}
            </div>
          </section>

          {fight.Participants && fight.Participants.length > 0 ? (
            <section className="rounded-xl border border-albion-gray-800 bg-albion-gray-900/70 p-3">
              <header className="mb-2 flex items-center gap-2 text-xs font-bold text-white">
                <Users className="h-3 w-3 text-neon-blue" /> Participants (
                {fight.Participants.length})
              </header>
              <div className="grid max-h-[200px] gap-1 overflow-y-auto">
                {fight.Participants.map((participant) => {
                  const participantData = participant as Player & { AverageItemPower?: number };
                  const participantIp =
                    typeof participantData.AverageItemPower === 'number'
                      ? Math.round(participantData.AverageItemPower)
                      : null;

                  return (
                    <div
                      key={participant.Id}
                      className="bg-albion-gray-850/70 flex items-center justify-between gap-2 rounded px-2 py-1 text-xs"
                    >
                      <span className="truncate text-white">{participant.Name}</span>
                      <span className="whitespace-nowrap text-xs text-albion-gray-500">
                        {participantIp ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface CombatantPanelProps {
  title: string;
  accentColor: 'green' | 'red';
  icon: React.ReactNode;
  player: Player;
  inventory: KillEvent['Victim']['Inventory'] | null;
}

function CombatantPanel({ title, accentColor, icon, player, inventory }: CombatantPanelProps) {
  const accentClasses =
    accentColor === 'green'
      ? {
          border: 'border-neon-green/40',
          background: 'bg-neon-green/10',
          title: 'text-neon-green',
        }
      : {
          border: 'border-neon-red/40',
          background: 'bg-neon-red/10',
          title: 'text-neon-red',
        };

  const playerData = player as Player & {
    AverageItemPower?: number;
    DamageDone?: number;
    Equipment?: KillEvent['Killer']['Equipment'];
  };
  const averageItemPower =
    typeof playerData.AverageItemPower === 'number' ? playerData.AverageItemPower : undefined;
  const damageDone = typeof playerData.DamageDone === 'number' ? playerData.DamageDone : undefined;
  const equipment = playerData.Equipment;

  return (
    <section
      className={`rounded-xl border ${accentClasses.border} bg-albion-gray-900/70 p-3 backdrop-blur`}
    >
      <header className="mb-2 flex items-center gap-2 text-xs">
        <span>{icon}</span>
        <span className={`font-semibold uppercase tracking-wide ${accentClasses.title}`}>
          {title}
        </span>
      </header>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div>
            <p className="truncate text-base font-bold text-white">{player.Name}</p>
            {player.GuildName ? (
              <p className="truncate text-[0.65rem] text-albion-gray-500">
                {player.GuildName}
                {player.AllianceName ? ` · ${player.AllianceName}` : ''}
              </p>
            ) : null}
          </div>
          {typeof averageItemPower === 'number' ? (
            <div className="bg-albion-gray-850/70 text-albion-gray-400 rounded-lg px-2 py-0.5 text-[0.65rem]">
              IP {Math.round(averageItemPower)}
            </div>
          ) : null}
        </div>
        <div
          className={`rounded-lg ${accentClasses.background} whitespace-nowrap px-2 py-1 text-[0.65rem] text-white/80`}
        >
          {typeof damageDone === 'number'
            ? `${compactFormatter.format(damageDone)} dmg`
            : 'No data'}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-albion-gray-800 bg-albion-gray-900/60 p-2">
        <EquipmentDisplay
          equipment={equipment ? (equipment as Equipment) : null}
          inventory={inventory?.filter(Boolean) as EquipmentItem[] | undefined}
          showInventory={Boolean(inventory?.length)}
        />
      </div>
    </section>
  );
}
