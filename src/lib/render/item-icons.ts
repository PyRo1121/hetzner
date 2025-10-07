import { type EquipmentSlot } from '@/components/pvp/equipment-display';

export interface ItemRenderOptions {
  size?: number;
  quality?: number;
  enchantment?: number;
}

interface RenderParams {
  itemId: string;
  quality: number;
  enchantment: number;
  size: number;
}

const DEFAULT_SIZE = 128;
const DEFAULT_QUALITY = 1;
const DEFAULT_ENCHANTMENT = 0;

function extractItemId(uniqueName: string): { itemId: string; enchantment: number } {
  const [base, enchantSuffix] = uniqueName.split('@');
  const enchantment = enchantSuffix ? Number.parseInt(enchantSuffix, 10) : DEFAULT_ENCHANTMENT;

  if (Number.isNaN(enchantment) || enchantment < 0) {
    return { itemId: base, enchantment: DEFAULT_ENCHANTMENT };
  }

  return { itemId: base, enchantment };
}

function buildRenderParams(type: string, slotQuality?: number, options?: ItemRenderOptions): RenderParams {
  const { itemId, enchantment } = extractItemId(type);

  const quality = options?.quality ?? slotQuality ?? DEFAULT_QUALITY;
  const size = options?.size ?? DEFAULT_SIZE;
  const enchant = options?.enchantment ?? enchantment;

  return {
    itemId,
    quality: Math.min(Math.max(quality, 1), 5),
    enchantment: Math.max(enchant, 0),
    size: Math.min(Math.max(size, 32), 256),
  };
}

export function getItemRenderPathFromSlot(
  slot: EquipmentSlot | null | undefined,
  options?: ItemRenderOptions,
): string | null {
  if (!slot?.Type) {
    return null;
  }

  return getItemRenderPath(slot.Type, {
    size: options?.size,
    quality: typeof slot.Quality === 'number' ? slot.Quality : options?.quality,
    enchantment: options?.enchantment,
  });
}

export function getItemRenderPath(type: string | null | undefined, options?: ItemRenderOptions): string | null {
  if (!type) {
    return null;
  }

  const params = buildRenderParams(type, options?.quality, options);
  const search = new URLSearchParams({
    itemId: params.itemId,
    quality: params.quality.toString(),
    enchantment: params.enchantment.toString(),
    size: params.size.toString(),
  });

  return `/api/render/item?${search.toString()}`;
}
