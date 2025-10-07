/**
 * Portfolio Manager
 * Track player wealth, investments, and trading performance
 */

export interface PortfolioItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice?: number;
  city: string;
  quality: number;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalProfit: number;
  profitPercentage: number;
  bestPerformer: PortfolioItem | null;
  worstPerformer: PortfolioItem | null;
  itemCount: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  city: string;
  timestamp: string;
  profit?: number;
}

/**
 * Portfolio Manager Class
 */
export class PortfolioManager {
  private items: Map<string, PortfolioItem> = new Map();
  private transactions: Transaction[] = [];

  constructor() {
    this.loadPortfolio();
  }

  /**
   * Load portfolio from localStorage
   */
  private loadPortfolio() {
    if (typeof window === 'undefined') {return;}

    try {
      const storedItems = localStorage.getItem('albion_portfolio_items');
      const storedTransactions = localStorage.getItem('albion_portfolio_transactions');

      if (storedItems) {
        const items = JSON.parse(storedItems) as PortfolioItem[];
        items.forEach(item => this.items.set(item.id, item));
      }

      if (storedTransactions) {
        this.transactions = JSON.parse(storedTransactions);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  }

  /**
   * Save portfolio to localStorage
   */
  private savePortfolio() {
    if (typeof window === 'undefined') {return;}

    try {
      const items = Array.from(this.items.values());
      localStorage.setItem('albion_portfolio_items', JSON.stringify(items));
      localStorage.setItem('albion_portfolio_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  }

  /**
   * Add item to portfolio
   */
  addItem(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
    const newItem: PortfolioItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
    };

    this.items.set(newItem.id, newItem);

    // Record transaction
    this.transactions.push({
      id: Math.random().toString(36).substring(7),
      type: 'buy',
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.purchasePrice,
      city: item.city,
      timestamp: new Date().toISOString(),
    });

    this.savePortfolio();
    return newItem;
  }

  /**
   * Remove item from portfolio
   */
  removeItem(id: string, sellPrice?: number): boolean {
    const item = this.items.get(id);
    if (!item) {return false;}

    // Record sell transaction if price provided
    if (sellPrice !== undefined) {
      const profit = (sellPrice - item.purchasePrice) * item.quantity;
      
      this.transactions.push({
        id: Math.random().toString(36).substring(7),
        type: 'sell',
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        price: sellPrice,
        city: item.city,
        timestamp: new Date().toISOString(),
        profit,
      });
    }

    const deleted = this.items.delete(id);
    if (deleted) {
      this.savePortfolio();
    }
    return deleted;
  }

  /**
   * Update item current price
   */
  updateItemPrice(id: string, currentPrice: number): boolean {
    const item = this.items.get(id);
    if (!item) {return false;}

    item.currentPrice = currentPrice;
    this.items.set(id, item);
    this.savePortfolio();
    return true;
  }

  /**
   * Get all portfolio items
   */
  getAllItems(): PortfolioItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get portfolio statistics
   */
  getStats(): PortfolioStats {
    const items = this.getAllItems();

    if (items.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitPercentage: 0,
        bestPerformer: null,
        worstPerformer: null,
        itemCount: 0,
      };
    }

    let totalValue = 0;
    let totalCost = 0;
    let bestPerformer: PortfolioItem | null = null;
    let worstPerformer: PortfolioItem | null = null;
    let maxProfit = -Infinity;
    let minProfit = Infinity;

    for (const item of items) {
      const cost = item.purchasePrice * item.quantity;
      const value = (item.currentPrice || item.purchasePrice) * item.quantity;
      const profit = value - cost;

      totalCost += cost;
      totalValue += value;

      if (profit > maxProfit) {
        maxProfit = profit;
        bestPerformer = item;
      }

      if (profit < minProfit) {
        minProfit = profit;
        worstPerformer = item;
      }
    }

    const totalProfit = totalValue - totalCost;
    const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalProfit,
      profitPercentage,
      bestPerformer,
      worstPerformer,
      itemCount: items.length,
    };
  }

  /**
   * Get transaction history
   */
  getTransactions(limit?: number): Transaction[] {
    const sorted = [...this.transactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get profit/loss over time period
   */
  getProfitOverTime(days: number = 30): { date: string; profit: number }[] {
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const relevantTransactions = this.transactions.filter(t => 
      new Date(t.timestamp).getTime() >= cutoff && t.type === 'sell' && t.profit !== undefined
    );

    // Group by date
    const profitByDate = new Map<string, number>();

    for (const transaction of relevantTransactions) {
      const date = new Date(transaction.timestamp).toLocaleDateString();
      const current = profitByDate.get(date) || 0;
      profitByDate.set(date, current + (transaction.profit || 0));
    }

    return Array.from(profitByDate.entries())
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Clear all portfolio data
   */
  clearPortfolio() {
    this.items.clear();
    this.transactions = [];
    this.savePortfolio();
  }

  /**
   * Export portfolio as JSON
   */
  exportPortfolio(): string {
    return JSON.stringify({
      items: Array.from(this.items.values()),
      transactions: this.transactions,
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Import portfolio from JSON
   */
  importPortfolio(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      if (data.items && Array.isArray(data.items)) {
        this.items.clear();
        data.items.forEach((item: PortfolioItem) => this.items.set(item.id, item));
      }

      if (data.transactions && Array.isArray(data.transactions)) {
        this.transactions = data.transactions;
      }

      this.savePortfolio();
      return true;
    } catch (error) {
      console.error('Failed to import portfolio:', error);
      return false;
    }
  }
}

// Singleton instance
export const portfolioManager = new PortfolioManager();
