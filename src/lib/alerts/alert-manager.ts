/**
 * Alert & Notification Manager
 * Manage price alerts, PvP notifications, and custom triggers
 */

export type AlertType = 'price' | 'pvp' | 'guild' | 'custom';
export type AlertCondition = 'above' | 'below' | 'equals' | 'change';

export interface Alert {
  id: string;
  type: AlertType;
  name: string;
  condition: AlertCondition;
  threshold: number;
  currentValue?: number;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  metadata?: Record<string, any>;
}

export interface PriceAlert extends Alert {
  type: 'price';
  itemId: string;
  itemName: string;
  city: string;
  quality: number;
}

export interface PvPAlert extends Alert {
  type: 'pvp';
  playerId?: string;
  guildId?: string;
  eventType: 'kill' | 'death' | 'battle';
}

/**
 * Alert Manager Class
 */
export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private listeners: Set<(alert: Alert) => void> = new Set();

  constructor() {
    this.loadAlerts();
  }

  /**
   * Load alerts from localStorage
   */
  private loadAlerts() {
    if (typeof window === 'undefined') {return;}

    try {
      const stored = localStorage.getItem('albion_alerts');
      if (stored) {
        const alerts = JSON.parse(stored) as Alert[];
        alerts.forEach(alert => this.alerts.set(alert.id, alert));
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }

  /**
   * Save alerts to localStorage
   */
  private saveAlerts() {
    if (typeof window === 'undefined') {return;}

    try {
      const alerts = Array.from(this.alerts.values());
      localStorage.setItem('albion_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };

    this.alerts.set(newAlert.id, newAlert);
    this.saveAlerts();

    return newAlert;
  }

  /**
   * Update an existing alert
   */
  updateAlert(id: string, updates: Partial<Alert>): Alert | null {
    const alert = this.alerts.get(id);
    if (!alert) {return null;}

    const updated = { ...alert, ...updates };
    this.alerts.set(id, updated);
    this.saveAlerts();

    return updated;
  }

  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      this.saveAlerts();
    }
    return deleted;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: AlertType): Alert[] {
    return this.getAllAlerts().filter(alert => alert.type === type);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.getAllAlerts().filter(alert => alert.isActive);
  }

  /**
   * Check if alert should trigger
   */
  checkAlert(alert: Alert, currentValue: number): boolean {
    switch (alert.condition) {
      case 'above':
        return currentValue > alert.threshold;
      case 'below':
        return currentValue < alert.threshold;
      case 'equals':
        return Math.abs(currentValue - alert.threshold) < 0.01;
      case 'change':
        if (alert.currentValue === undefined) {return false;}
        const change = Math.abs(currentValue - alert.currentValue);
        return change >= alert.threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  triggerAlert(alert: Alert) {
    const updated = {
      ...alert,
      lastTriggered: new Date().toISOString(),
    };

    this.alerts.set(alert.id, updated);
    this.saveAlerts();

    // Notify listeners
    this.listeners.forEach(listener => listener(updated));

    // Show browser notification if permitted
    this.showNotification(alert);
  }

  /**
   * Show browser notification
   */
  private async showNotification(alert: Alert) {
    if (typeof window === 'undefined' || !('Notification' in window)) {return;}

    if (Notification.permission === 'granted') {
      new Notification('Albion Alert', {
        body: `${alert.name} triggered!`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showNotification(alert);
      }
    }
  }

  /**
   * Add alert listener
   */
  addListener(listener: (alert: Alert) => void) {
    this.listeners.add(listener);
  }

  /**
   * Remove alert listener
   */
  removeListener(listener: (alert: Alert) => void) {
    this.listeners.delete(listener);
  }

  /**
   * Monitor alerts (call periodically)
   */
  async monitorAlerts(dataFetcher: (alert: Alert) => Promise<number>) {
    const activeAlerts = this.getActiveAlerts();

    for (const alert of activeAlerts) {
      try {
        const currentValue = await dataFetcher(alert);
        
        // Update current value
        this.updateAlert(alert.id, { currentValue });

        // Check if should trigger
        if (this.checkAlert(alert, currentValue)) {
          this.triggerAlert(alert);
        }
      } catch (error) {
        console.error(`Failed to check alert ${alert.id}:`, error);
      }
    }
  }
}

// Singleton instance
export const alertManager = new AlertManager();
