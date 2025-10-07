/**
 * Notification Service (Singleton)
 * Handles real-time alerts and notifications
 * Supports browser notifications, sound alerts, and local storage
 */

export type NotificationType = 'price' | 'pvp' | 'guild' | 'arbitrage';

export interface NotificationConfig {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  data?: any;
  read: boolean;
  sound?: boolean;
  browser?: boolean;
}

export interface AlertConfig {
  type: NotificationType;
  enabled: boolean;
  threshold?: number; // for price alerts
  sound: boolean;
  browser: boolean;
}

class NotificationService {
  private static instance: NotificationService | null = null;
  private notifications: NotificationConfig[] = [];
  private alertConfigs: Map<NotificationType, AlertConfig> = new Map();
  private soundEnabled = true;

  static getInstance(): NotificationService {
    NotificationService.instance ??= new NotificationService();
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Load saved notifications from localStorage
    const saved = localStorage.getItem('albion-notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }

    // Load alert configurations
    const configs = localStorage.getItem('albion-alert-configs');
    if (configs) {
      try {
        const parsed = JSON.parse(configs) as Record<NotificationType, AlertConfig>;
        this.alertConfigs = new Map(Object.entries(parsed) as [NotificationType, AlertConfig][]);
      } catch (error) {
        console.error('Failed to load alert configs:', error);
      }
    }

    // Set default configurations if none exist
    if (this.alertConfigs.size === 0) {
      this.alertConfigs.set('price', {
        type: 'price',
        enabled: true,
        threshold: 1000,
        sound: true,
        browser: true,
      });
      this.alertConfigs.set('pvp', { type: 'pvp', enabled: true, sound: true, browser: true });
      this.alertConfigs.set('guild', { type: 'guild', enabled: true, sound: true, browser: true });
      this.alertConfigs.set('arbitrage', {
        type: 'arbitrage',
        enabled: true,
        sound: true,
        browser: true,
      });
      this.saveAlertConfigs();
    }
  }

  addNotification(config: Omit<NotificationConfig, 'id' | 'timestamp' | 'read'>): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationConfig = {
      id,
      ...config,
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.unshift(notification);
    this.notifications = this.notifications.slice(0, 100); // Keep only last 100

    // Save to localStorage
    localStorage.setItem('albion-notifications', JSON.stringify(this.notifications));

    // Trigger alerts if configured
    void this.triggerAlert(notification);

    return id;
  }

  getNotifications(limit: number = 50): NotificationConfig[] {
    return this.notifications.slice(0, limit);
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
  }

  clearNotifications(): void {
    this.notifications = [];
    localStorage.removeItem('albion-notifications');
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  updateAlertConfig(type: NotificationType, config: Partial<AlertConfig>): void {
    const existing = this.alertConfigs.get(type) ?? {
      type,
      enabled: true,
      sound: true,
      browser: true,
    };
    this.alertConfigs.set(type, { ...existing, ...config });
    this.saveAlertConfigs();
  }

  getAlertConfig(type: NotificationType): AlertConfig {
    return this.alertConfigs.get(type) ?? { type, enabled: true, sound: true, browser: true };
  }

  private saveNotifications(): void {
    localStorage.setItem('albion-notifications', JSON.stringify(this.notifications));
  }

  private saveAlertConfigs(): void {
    const configs = Object.fromEntries(this.alertConfigs);
    localStorage.setItem('albion-alert-configs', JSON.stringify(configs));
  }

  private triggerAlert(notification: NotificationConfig): void {
    const config = this.alertConfigs.get(notification.type);

    if (!config?.enabled) {
      return;
    }

    // Sound alert
    if (config.sound && this.soundEnabled) {
      this.playNotificationSound();
    }

    // Browser notification
    if (config.browser && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type,
      });
    }

    // Custom event for components to listen to
    window.dispatchEvent(new CustomEvent('albion-notification', { detail: notification }));
  }

  private playNotificationSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  // Alert helper methods
  async alertPriceChange(
    itemId: string,
    oldPrice: number,
    newPrice: number,
    city: string
  ): Promise<void> {
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    const isIncrease = change > 0;

    this.addNotification({
      type: 'price',
      title: `${isIncrease ? '📈' : '📉'} Price Alert: ${itemId}`,
      message: `Price ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in ${city}`,
      data: { itemId, oldPrice, newPrice, city, change },
      sound: true,
      browser: true,
    });
  }

  async alertArbitrageOpportunity(
    itemId: string,
    profit: number,
    buyCity: string,
    sellCity: string
  ): Promise<void> {
    this.addNotification({
      type: 'arbitrage',
      title: '💰 Arbitrage Opportunity',
      message: `${itemId}: ${profit.toLocaleString()} profit (${buyCity} → ${sellCity})`,
      data: { itemId, profit, buyCity, sellCity },
      sound: true,
      browser: true,
    });
  }

  async alertPVPKill(killer: string, victim: string, fame: number): Promise<void> {
    this.addNotification({
      type: 'pvp',
      title: '⚔️ PvP Kill',
      message: `${killer} defeated ${victim} (${fame.toLocaleString()} fame)`,
      data: { killer, victim, fame },
      sound: true,
      browser: false, // Less intrusive for PvP
    });
  }

  async alertGuildActivity(guildName: string, activity: string, details?: string): Promise<void> {
    this.addNotification({
      type: 'guild',
      title: `🏰 Guild Activity: ${guildName}`,
      message: `${activity}${details ? `: ${details}` : ''}`,
      data: { guildName, activity, details },
      sound: true,
      browser: true,
    });
  }
}

export const notificationService = NotificationService.getInstance();
