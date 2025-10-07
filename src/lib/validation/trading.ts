/**
 * Trading Input Validation
 * Validates user inputs for trading calculators
 */

import { z } from 'zod';

// City names validation
const VALID_CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Martlock', 'Fort Sterling', 'Thetford'] as const;

// Mount types validation
const VALID_MOUNT_TYPES = ['none', 'ox', 'horse', 'direwolf', 'swiftclaw'] as const;

/**
 * Arbitrage input validation schema
 */
export const arbitrageInputSchema = z.object({
  itemId: z.string()
    .min(1, 'Item ID is required')
    .regex(/^[A-Z0-9_]+$/, 'Item ID must contain only uppercase letters, numbers, and underscores')
    .max(100, 'Item ID is too long'),
  
  buyCity: z.enum(VALID_CITIES, {
    message: 'Invalid buy city selected',
  }),
  
  sellCity: z.enum(VALID_CITIES, {
    message: 'Invalid sell city selected',
  }),
  
  buyPrice: z.number()
    .int('Buy price must be a whole number')
    .min(1, 'Buy price must be at least 1 silver')
    .max(1_000_000_000, 'Buy price is unrealistically high'),
  
  sellPrice: z.number()
    .int('Sell price must be a whole number')
    .min(1, 'Sell price must be at least 1 silver')
    .max(1_000_000_000, 'Sell price is unrealistically high'),
  
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(10_000, 'Quantity is too high (max 10,000)'),
  
  quality: z.number()
    .int('Quality must be a whole number')
    .min(0, 'Quality must be between 0 and 5')
    .max(5, 'Quality must be between 0 and 5')
    .optional(),
}).refine(
  (data) => data.buyCity !== data.sellCity,
  {
    message: 'Buy and sell cities must be different',
    path: ['sellCity'],
  }
);

/**
 * Transport costs validation schema
 */
export const transportCostsSchema = z.object({
  mountType: z.enum(VALID_MOUNT_TYPES, {
    message: 'Invalid mount type selected',
  }),
  
  weight: z.number()
    .min(0, 'Weight cannot be negative')
    .max(10_000, 'Weight is too high (max 10,000 kg)'),
  
  distance: z.number()
    .int('Distance must be a whole number')
    .min(0, 'Distance cannot be negative')
    .max(50, 'Distance is too high (max 50 zones)'),
  
  riskFactor: z.number()
    .min(0, 'Risk factor must be between 0 and 1')
    .max(1, 'Risk factor must be between 0 and 1'),
});

/**
 * Price range validation schema
 */
export const priceRangeSchema = z.object({
  minPrice: z.number()
    .int('Minimum price must be a whole number')
    .min(0, 'Minimum price cannot be negative'),
  
  maxPrice: z.number()
    .int('Maximum price must be a whole number')
    .min(0, 'Maximum price cannot be negative'),
}).refine(
  (data) => data.maxPrice >= data.minPrice,
  {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['maxPrice'],
  }
);

/**
 * Quantity range validation schema
 */
export const quantityRangeSchema = z.object({
  minQuantity: z.number()
    .int('Minimum quantity must be a whole number')
    .min(1, 'Minimum quantity must be at least 1'),
  
  maxQuantity: z.number()
    .int('Maximum quantity must be a whole number')
    .min(1, 'Maximum quantity must be at least 1'),
}).refine(
  (data) => data.maxQuantity >= data.minQuantity,
  {
    message: 'Maximum quantity must be greater than or equal to minimum quantity',
    path: ['maxQuantity'],
  }
);

/**
 * Validate arbitrage input
 */
export function validateArbitrageInput(input: unknown) {
  return arbitrageInputSchema.safeParse(input);
}

/**
 * Validate transport costs
 */
export function validateTransportCosts(costs: unknown) {
  return transportCostsSchema.safeParse(costs);
}

/**
 * Validate price range
 */
export function validatePriceRange(range: unknown) {
  return priceRangeSchema.safeParse(range);
}

/**
 * Validate quantity range
 */
export function validateQuantityRange(range: unknown) {
  return quantityRangeSchema.safeParse(range);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  for (const error of errors.issues) {
    const path = error.path.join('.');
    formatted[path] = error.message;
  }
  
  return formatted;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumericInput(value: string | number): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Sanitize item ID input
 */
export function sanitizeItemId(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .slice(0, 100);
}

/**
 * Check if price is reasonable
 */
export function isPriceReasonable(price: number, itemTier: number = 8): boolean {
  // Basic sanity checks based on tier
  const minReasonablePrice = itemTier * 1000;
  const maxReasonablePrice = itemTier * 1_000_000;
  
  return price >= minReasonablePrice && price <= maxReasonablePrice;
}

/**
 * Check if quantity is reasonable for trading
 */
export function isQuantityReasonable(_quantity: number, totalValue: number): boolean {
  // Check if total trade value is reasonable (not too small or too large)
  const minTradeValue = 10_000; // 10K silver minimum
  const maxTradeValue = 1_000_000_000; // 1B silver maximum
  
  return totalValue >= minTradeValue && totalValue <= maxTradeValue;
}
