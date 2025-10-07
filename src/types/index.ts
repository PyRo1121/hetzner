/**
 * Core type definitions for Albion Online Omni-Dashboard
 */

export type Server = 'Americas' | 'Europe' | 'Asia';

export type City =
  | 'Caerleon'
  | 'Bridgewatch'
  | 'Lymhurst'
  | 'Martlock'
  | 'Fort Sterling'
  | 'Thetford'
  | 'Black Market';

export type Quality = 1 | 2 | 3 | 4 | 5;

export type ItemTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface MarketPrice {
  itemId: string;
  itemName: string;
  city: City;
  quality: Quality;
  sellPriceMin: number;
  sellPriceMax: number;
  buyPriceMin: number;
  buyPriceMax: number;
  timestamp: Date;
  server: Server;
}

export interface PriceHistory {
  itemId: string;
  itemName: string;
  city: City;
  quality: Quality;
  avgPrice: number;
  itemCount: number;
  timestamp: Date;
  server: Server;
}

export interface Item {
  id: string;
  name: string;
  tier: ItemTier;
  category: string;
  subcategory?: string;
  iconUrl?: string;
}

export interface GoldPrice {
  price: number;
  timestamp: Date;
  server: Server;
}

export interface PriceAlert {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  city: City;
  quality: Quality;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

export interface UserPreference {
  defaultServer: Server;
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface SavedFilter {
  id: string;
  userId: string;
  name: string;
  filterConfig: Record<string, unknown>;
  isPublic: boolean;
}
