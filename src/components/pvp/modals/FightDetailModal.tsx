'use client';

import { useEffect, useMemo, useState } from 'react';

import { Skull, Sparkles, Swords, Trophy, Users } from 'lucide-react';

import { EquipmentDisplay, type Equipment } from '@/components/pvp/equipment-display';
import { useLootValue } from '@/hooks/use-loot-value';
import { type EquipmentItem, type KillEvent, type Player } from '@/lib/api/gameinfo/client';
import { itemsService } from '@/lib/services/items.service';
import { formatSilver } from '@/lib/trading/arbitrage';

interface LootEntry {
  uniqueName: string;
  count: number;
  estimatedUnitValue: number;
  estimatedTotalValue: number;
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

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

export interface FightDetailModalProps {
  fight: KillEvent;
}

export function FightDetailModal({ fight }: FightDetailModalProps) {
  const [lootNames, setLootNames] = useState<Map<string, string>>(new Map());

  const inventory =
    fight.Victim.Inventory?.filter((item): item is NonNullable<typeof item> => item !== null) ?? [];
  const { data: loot, isLoading: lootLoading } = useLootValue(inventory, true);
  const lootEntries = useMemo<LootEntry[]>(() => loot?.entries ?? [], [loot?.entries]);

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
          names.set(entry.uniqueName, formatItemId(entry.uniqueName));
        }
      }
      setLootNames(names);
    }

    void loadLootNames();
  }, [lootEntries]);

  return (
    <div className="space-y-4">
      {/* Header */}
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
        {/* Victor */}
        <CombatantPanel
          title="Victor"
          accentColor="green"
          icon={<Trophy className="h-4 w-4 text-neon-green" />}
          player={fight.Killer}
          inventory={null}
        />

        {/* Fallen */}
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

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 hidden -translate-x-1/2 group-hover:block">
                      <div className="bg-albion-gray-950 whitespace-nowrap rounded-lg border-2 border-neon-blue px-4 py-3 shadow-2xl">
                        <p className="mb-1 text-sm font-bold text-white">{itemName}</p>
                        <p className="text-albion-gray-400 text-xs">
                          Quantity: <span className="font-semibold text-white">{entry.count}</span>
                        </p>
                        <p className="text-albion-gray-400 text-xs">
                          Value: <span className="font-semibold text-neon-green">{formatSilver(entry.estimatedTotalValue)}</span>
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
                <Users className="h-3 w-3 text-neon-blue" /> Participants ({fight.Participants.length})
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
      ? { border: 'border-neon-green/40', background: 'bg-neon-green/10', title: 'text-neon-green' }
      : { border: 'border-neon-red/40', background: 'bg-neon-red/10', title: 'text-neon-red' };

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
    <section className={`rounded-xl border ${accentClasses.border} bg-albion-gray-900/70 p-3 backdrop-blur`}>
      <header className="mb-2 flex items-center gap-2 text-xs">
        <span>{icon}</span>
        <span className={`font-semibold uppercase tracking-wide ${accentClasses.title}`}>{title}</span>
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
        <div className={`rounded-lg ${accentClasses.background} whitespace-nowrap px-2 py-1 text-[0.65rem] text-white/80`}>
          {typeof damageDone === 'number' ? `${compactFormatter.format(damageDone)} dmg` : 'No data'}
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