'use client';
/**
 * Equipment Display Component
 * Visual Albion-style equipment grid showing gear like in-game inventory
 */

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { getItemRenderPath } from '@/lib/render/item-icons';
import { itemsService } from '@/lib/services/items.service';
export interface EquipmentSlot {
  Type: string;
  Count?: number | null;
  Quality?: number | null;
}

export interface Equipment {
  MainHand?: EquipmentSlot | null;
  OffHand?: EquipmentSlot | null;
  Head?: EquipmentSlot | null;
  Armor?: EquipmentSlot | null;
  Shoes?: EquipmentSlot | null;
  Cape?: EquipmentSlot | null;
  Bag?: EquipmentSlot | null;
  Mount?: EquipmentSlot | null;
  Potion?: EquipmentSlot | null;
  Food?: EquipmentSlot | null;
  [key: string]: EquipmentSlot | null | undefined;
}

interface EquipmentDisplayProps {
  equipment: Equipment | null;
  inventory?: (EquipmentSlot | null | undefined)[] | null;
  title?: string;
  showInventory?: boolean;
}

export function EquipmentDisplay({
  equipment,
  inventory,
  title,
  showInventory = false,
}: EquipmentDisplayProps) {
  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    async function loadItemNames() {
      if (!equipment) {
        return;
      }

      const names = new Map<string, string>();
      const slots = [
        equipment.MainHand,
        equipment.OffHand,
        equipment.Head,
        equipment.Armor,
        equipment.Shoes,
        equipment.Cape,
        equipment.Bag,
        equipment.Mount,
        equipment.Potion,
        equipment.Food,
      ];

      for (const slot of slots) {
        if (slot?.Type) {
          try {
            const item = await itemsService.getById(slot.Type);
            if (item) {
              const localizedName = itemsService.getLocalizedName(item);
              names.set(slot.Type, localizedName);
            }
          } catch (_error) {
            // Use type as fallback
            names.set(slot.Type, slot.Type);
          }
        }
      }

      // Load inventory item names
      if (inventory) {
        for (const item of inventory) {
          if (item?.Type && !names.has(item.Type)) {
            try {
              const itemData = await itemsService.getById(item.Type);
              if (itemData) {
                const localizedName = itemsService.getLocalizedName(itemData);
                names.set(item.Type, localizedName);
              }
            } catch (_error) {
              names.set(item.Type, item.Type);
            }
          }
        }
      }

      setItemNames(names);
    }

    void loadItemNames();
  }, [equipment, inventory]);

  if (!equipment) {
    return <div className="text-sm text-albion-gray-500">No equipment data</div>;
  }

  const getQualityColor = (quality?: number | null) => {
    const normalized = typeof quality === 'number' ? quality : undefined;
    switch (normalized) {
      case 1:
        return 'border-gray-500';
      case 2:
        return 'border-green-500';
      case 3:
        return 'border-blue-500';
      case 4:
        return 'border-purple-500';
      case 5:
        return 'border-yellow-500';
      default:
        return 'border-albion-gray-600';
    }
  };

  const getTierColor = (type?: string) => {
    if (!type) {
      return 'bg-albion-gray-800';
    }
    const tier = type.match(/T(\d)/)?.[1];
    switch (tier) {
      case '4':
        return 'bg-gradient-to-br from-blue-900/30 to-blue-800/20';
      case '5':
        return 'bg-gradient-to-br from-blue-700/30 to-blue-600/20';
      case '6':
        return 'bg-gradient-to-br from-purple-900/30 to-purple-800/20';
      case '7':
        return 'bg-gradient-to-br from-purple-700/30 to-purple-600/20';
      case '8':
        return 'bg-gradient-to-br from-yellow-900/30 to-yellow-800/20';
      default:
        return 'bg-albion-gray-800';
    }
  };

  const getEnchantment = (type: string | undefined | null): number | undefined => {
    if (!type) {
      return undefined;
    }
    const [, enchantSuffix] = type.split('@');
    if (!enchantSuffix) {
      return undefined;
    }
    const parsed = Number.parseInt(enchantSuffix, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const renderSlot = (slot: EquipmentSlot | null | undefined, label: string) => {
    const quality = typeof slot?.Quality === 'number' ? slot.Quality : undefined;
    const enchantment = getEnchantment(slot?.Type);
    const iconPath = slot?.Type
      ? getItemRenderPath(slot.Type, { size: 64, quality, enchantment })
      : null;
    const fallbackIcon = getFallbackIcon(label);
    const altText = slot?.Type ? (itemNames.get(slot.Type) ?? slot.Type) : `${label} slot empty`;
    const displayCount = typeof slot?.Count === 'number' && slot.Count > 1 ? slot.Count : null;

    return (
      <div className="group relative">
        <div
          className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${slot ? getQualityColor(slot.Quality) : 'border-albion-gray-700'} ${slot ? getTierColor(slot.Type) : 'bg-albion-gray-900/50'} ${slot ? 'hover:scale-105 hover:shadow-lg' : ''} `}
        >
          {slot ? (
            iconPath ? (
              <Image
                src={iconPath}
                alt={altText}
                width={64}
                height={64}
                sizes="64px"
                className="h-full w-full object-contain"
                loading="lazy"
                unoptimized
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {fallbackIcon}
              </div>
            )
          ) : null}

          {displayCount ? (
            <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">
              {displayCount}
            </div>
          ) : null}

          {quality && quality > 1 ? (
            <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500" />
          ) : null}
        </div>

        {slot ? (
          <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 group-hover:block">
            <div className="whitespace-nowrap rounded-lg border border-neon-blue/30 bg-albion-gray-900 px-3 py-2 text-xs shadow-xl">
              <p className="font-bold text-white">{itemNames.get(slot.Type) ?? slot.Type}</p>
              {slot.Quality ? <p className="text-neon-blue">Quality {slot.Quality}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {title ? <h4 className="font-bold text-white">{title}</h4> : null}

      {/* Equipment Grid - Albion Style */}
      <div className="inline-block rounded-lg border border-amber-800/30 bg-gradient-to-b from-amber-900/20 to-amber-950/30 p-4">
        {/* Top Row */}
        <div className="mb-2 grid grid-cols-3 gap-2">
          {renderSlot(equipment.Bag, 'Bag')}
          {renderSlot(equipment.Head, 'Head')}
          {renderSlot(equipment.Cape, 'Cape')}
        </div>

        {/* Middle Row */}
        <div className="mb-2 grid grid-cols-3 gap-2">
          {renderSlot(equipment.MainHand, 'Weapon')}
          {renderSlot(equipment.Armor, 'Armor')}
          {renderSlot(equipment.OffHand, 'Off-Hand')}
        </div>

        {/* Bottom Row */}
        <div className="mb-2 grid grid-cols-3 gap-2">
          {renderSlot(equipment.Mount, 'Mount')}
          {renderSlot(equipment.Shoes, 'Shoes')}
          {renderSlot(equipment.Potion, 'Potion')}
        </div>

        {/* Food Row */}
        <div className="flex justify-center">{renderSlot(equipment.Food, 'Food')}</div>
      </div>

      {/* Inventory Grid */}
      {showInventory && inventory && inventory.length > 0 ? (
        <div className="mt-4">
          <h5 className="text-albion-gray-400 mb-3 text-sm font-bold">Loot Dropped</h5>
          <div className="grid grid-cols-6 gap-3">
            {inventory.map((item, idx) => {
              if (!item) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-14 w-14 rounded border-2 border-dashed border-albion-gray-700 bg-albion-gray-900/30"
                  />
                );
              }

              const quality = typeof item.Quality === 'number' ? item.Quality : undefined;
              const enchantment = getEnchantment(item.Type);
              const displayCount =
                typeof item.Count === 'number' && item.Count > 1 ? item.Count : null;

              const iconPath = getItemRenderPath(item.Type, {
                size: 56,
                quality,
                enchantment,
              });
              const altText = itemNames.get(item.Type) ?? item.Type;

              return (
                <div key={`${item.Type}-${idx}`} className="group relative">
                  <div className="relative h-16 w-16 cursor-pointer overflow-hidden transition-all hover:scale-105">
                    {iconPath ? (
                      <Image
                        src={iconPath}
                        alt={altText}
                        width={56}
                        height={56}
                        sizes="56px"
                        className="h-full w-full object-contain"
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xl">
                        💎
                      </div>
                    )}

                    {displayCount ? (
                      <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-xs font-bold text-white">
                        {displayCount}
                      </div>
                    ) : null}

                    {/* Tooltip - appears on hover */}
                    <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-[9999] mb-2 -translate-x-1/2 group-hover:visible">
                      <div className="border-neon-orange whitespace-nowrap rounded-lg border-2 bg-black px-4 py-3 text-sm shadow-2xl">
                        <p className="font-bold text-white">{altText}</p>
                        {displayCount ? (
                          <p className="text-neon-orange mt-1 font-semibold">
                            Quantity: x{displayCount}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFallbackIcon(label: string): string {
  switch (label) {
    case 'Weapon':
      return '⚔️';
    case 'Off-Hand':
      return '🛡️';
    case 'Head':
      return '🎩';
    case 'Armor':
      return '👔';
    case 'Shoes':
      return '👢';
    case 'Cape':
      return '🧣';
    case 'Bag':
      return '🎒';
    case 'Mount':
      return '🐴';
    case 'Potion':
      return '🧪';
    case 'Food':
      return '🍖';
    default:
      return '💠';
  }
}
