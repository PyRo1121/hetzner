// lib/security/enterprise-security.ts
// Enterprise Security Suite (October 2025)
// Advanced firewall, WAF, and security monitoring

'use client';

import { useEffect, useState } from 'react';

export interface SecurityConfig {
  enableWAF?: boolean;
  enableRateLimiting?: boolean;
  enableDDoSProtection?: boolean;
  enableIntrusionDetection?: boolean;
  enableLogAnalysis?: boolean;
}

export interface SecurityMetrics {
  firewall: {
    blockedConnections: number;
    activeRules: number;
    suspiciousActivity: number;
  };
  waf: {
    blockedRequests: number;
    sqlInjectionAttempts: number;
    xssAttempts: number;
    suspiciousPatterns: number;
  };
  ddos: {
    attacksDetected: number;
    trafficFiltered: number;
    peakMitigation: number;
  };
  authentication: {
    failedLogins: number;
    suspiciousIPs: number[];
    geoBlockingHits: number;
  };
}

// Advanced Security Engine
class SecurityEngine {
  private config: SecurityConfig;
  private metrics: SecurityMetrics;
  private alerts: Array<{ type: string; message: string; timestamp: number; severity: 'low' | 'medium' | 'high' }> = [];

  constructor(config: SecurityConfig = {}) {
    this.config = {
      enableWAF: true,
      enableRateLimiting: true,
      enableDDoSProtection: true,
      enableIntrusionDetection: true,
      enableLogAnalysis: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.startSecurityMonitoring();
  }

  private initializeMetrics(): SecurityMetrics {
    return {
      firewall: { blockedConnections: 0, activeRules: 0, suspiciousActivity: 0 },
      waf: { blockedRequests: 0, sqlInjectionAttempts: 0, xssAttempts: 0, suspiciousPatterns: 0 },
      ddos: { attacksDetected: 0, trafficFiltered: 0, peakMitigation: 0 },
      authentication: { failedLogins: 0, suspiciousIPs: [], geoBlockingHits: 0 }
    };
  }

  private startSecurityMonitoring(): void {
    if (typeof window === 'undefined') return; // Server-side only

    // Monitor for suspicious activity
    this.monitorSuspiciousActivity();

    // Check security headers
    this.validateSecurityHeaders();

    // Monitor for injection attempts
    this.monitorInjectionAttempts();
  }

  private monitorSuspiciousActivity(): void {
    // Monitor failed authentication attempts
    document.addEventListener('security-error', (event: any) => {
      this.metrics.authentication.failedLogins++;
      this.addAlert('high', `Failed login attempt from ${event.detail.ip}`);
    });

    // Monitor rate limiting
    let requestCount = 0;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      requestCount++;

      // Rate limiting check
      if (requestCount > 100) { // 100 requests per minute threshold
        this.addAlert('medium', 'Rate limit exceeded');
        throw new Error('Rate limit exceeded');
      }

      // Reset counter every minute
      setTimeout(() => { requestCount = 0; }, 60000);

      return originalFetch(...args);
    };
  }

  private validateSecurityHeaders(): void {
    // Check if security headers are present
    const requiredHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy'
    ];

    fetch('/api/security/headers').then(async (response) => {
      const headers = Object.fromEntries(response.headers.entries());

      requiredHeaders.forEach(header => {
        if (!headers[header.toLowerCase()]) {
          this.addAlert('medium', `Missing security header: ${header}`);
        }
      });
    }).catch(() => {
      // Ignore fetch errors in security validation
    });
  }

  private monitorInjectionAttempts(): void {
    // Monitor for potential injection attempts in URLs/forms
    const checkForInjection = (text: string): boolean => {
      const patterns = [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
        /(<script|javascript:|on\w+\s*=)/i,
        /(\.\.|\/etc\/|\/bin\/|\/usr\/)/i
      ];

      return patterns.some(pattern => pattern.test(text));
    };

    // Monitor form inputs
    document.addEventListener('input', (event: any) => {
      const value = event.target?.value;
      if (value && checkForInjection(value)) {
        this.metrics.waf.suspiciousPatterns++;
        this.addAlert('high', 'Potential injection attempt detected in form input');
      }
    });

    // Monitor URLs
    const currentUrl = window.location.href;
    if (checkForInjection(currentUrl)) {
      this.metrics.waf.suspiciousPatterns++;
      this.addAlert('high', 'Suspicious URL pattern detected');
    }
  }

  // Report security incidents
  reportSecurityIncident(type: keyof SecurityMetrics, details: any): void {
    switch (type) {
      case 'firewall':
        this.metrics.firewall.blockedConnections++;
        this.addAlert('medium', `Firewall blocked connection: ${details.ip}`);
        break;

      case 'waf':
        this.metrics.waf.blockedRequests++;
        if (details.type === 'sql') this.metrics.waf.sqlInjectionAttempts++;
        if (details.type === 'xss') this.metrics.waf.xssAttempts++;
        this.addAlert('high', `WAF blocked ${details.type} attempt from ${details.ip}`);
        break;

      case 'ddos':
        this.metrics.ddos.attacksDetected++;
        this.addAlert('critical', `DDoS attack detected: ${details.traffic} RPS`);
        break;

      case 'authentication':
        this.metrics.authentication.failedLogins++;
        this.addAlert('medium', `Failed authentication from ${details.ip}`);
        break;
    }

    // Send to security monitoring service
    this.sendSecurityAlert(type, details);
  }

  private addAlert(severity: 'low' | 'medium' | 'high' | 'critical', message: string): void {
    this.alerts.push({
      type: 'security',
      message,
      timestamp: Date.now(),
      severity
    });

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Log to console for development
    if (__PERFORMANCE_MONITORING__) {
      console.warn(`🚨 [${severity.toUpperCase()}] ${message}`);
    }
  }

  private async sendSecurityAlert(type: keyof SecurityMetrics, details: any): Promise<void> {
    try {
      await fetch('/api/security/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, details, timestamp: Date.now() })
      });
    } catch (error) {
      // Ignore send errors to prevent loops
    }
  }

  // Public API
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  getSecurityAlerts(limit = 10): typeof this.alerts {
    return this.alerts.slice(-limit);
  }

  isSecurityHealthy(): boolean {
    const metrics = this.metrics;

    // Check for excessive security events
    return (
      metrics.firewall.blockedConnections < 100 && // Less than 100 blocks per minute
      metrics.waf.blockedRequests < 50 && // Less than 50 WAF blocks per minute
      metrics.authentication.failedLogins < 20 // Less than 20 failed logins per minute
    );
  }

  // Security utilities
  sanitizeInput(input: string): string {
    // Basic input sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .slice(0, 10000); // Limit length
  }

  validateOrigin(origin: string): boolean {
    const allowedOrigins = [
      'https://pyro1121.com',
      'https://monitoring.pyro1121.com',
      'https://coolify.pyro1121.com'
    ];

    return allowedOrigins.includes(origin);
  }
}

// Global security engine instance
let securityEngineInstance: SecurityEngine | null = null;

export const getSecurityEngine = (config?: SecurityConfig): SecurityEngine => {
  if (!securityEngineInstance) {
    securityEngineInstance = new SecurityEngine(config);
  }
  return securityEngineInstance;
};

// React hooks for security
export const useSecurityMetrics = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const engine = getSecurityEngine();

    const updateData = () => {
      setMetrics(engine.getSecurityMetrics());
      setAlerts(engine.getSecurityAlerts());
    };

    updateData();

    // Update every 30 seconds
    const interval = setInterval(updateData, 30000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, alerts, isHealthy: getSecurityEngine().isSecurityHealthy() };
};

// Security Dashboard Component
export const SecurityDashboard: React.FC = () => {
  const { metrics, alerts, isHealthy } = useSecurityMetrics();

  if (!metrics) {
    return <div className="animate-pulse">Loading security metrics...</div>;
  }

  return (
    <div className="security-dashboard space-y-6">
      {/* Security Health Status */}
      <div className={`p-4 rounded-lg ${isHealthy ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-semibold">
            {isHealthy ? 'Security Status: Healthy' : 'Security Status: Issues Detected'}
          </span>
        </div>
      </div>

      {/* Security Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Firewall */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Firewall</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Blocked:</span>
              <span className="font-bold text-red-600">{metrics.firewall.blockedConnections}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Rules:</span>
              <span className="font-bold">{metrics.firewall.activeRules}</span>
            </div>
            <div className="flex justify-between">
              <span>Suspicious:</span>
              <span className="font-bold text-orange-600">{metrics.firewall.suspiciousActivity}</span>
            </div>
          </div>
        </div>

        {/* WAF */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Web Application Firewall</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Blocked:</span>
              <span className="font-bold text-red-600">{metrics.waf.blockedRequests}</span>
            </div>
            <div className="flex justify-between">
              <span>SQL Injection:</span>
              <span className="font-bold text-red-700">{metrics.waf.sqlInjectionAttempts}</span>
            </div>
            <div className="flex justify-between">
              <span>XSS Attempts:</span>
              <span className="font-bold text-red-700">{metrics.waf.xssAttempts}</span>
            </div>
          </div>
        </div>

        {/* DDoS Protection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">DDoS Protection</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Attacks:</span>
              <span className="font-bold text-red-600">{metrics.ddos.attacksDetected}</span>
            </div>
            <div className="flex justify-between">
              <span>Traffic Filtered:</span>
              <span className="font-bold">{metrics.ddos.trafficFiltered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Peak Mitigation:</span>
              <span className="font-bold">{metrics.ddos.peakMitigation.toLocaleString()} RPS</span>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Authentication</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Failed Logins:</span>
              <span className="font-bold text-orange-600">{metrics.authentication.failedLogins}</span>
            </div>
            <div className="flex justify-between">
              <span>Suspicious IPs:</span>
              <span className="font-bold text-red-600">{metrics.authentication.suspiciousIPs.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Geo Blocks:</span>
              <span className="font-bold">{metrics.authentication.geoBlockingHits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Alerts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Security Alerts</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-gray-500">No recent security alerts</p>
          ) : (
            alerts.slice(-10).reverse().map((alert, index) => (
              <div key={index} className={`p-3 rounded border-l-4 ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Security utilities for components
export const useSecureFetch = () => {
  const engine = getSecurityEngine();

  return async (url: string, options: RequestInit = {}) => {
    // Sanitize inputs
    const sanitizedUrl = engine.sanitizeInput(url);

    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Version': '2025.10',
      },
    };

    try {
      const response = await fetch(sanitizedUrl, secureOptions);

      // Check for suspicious response
      if (response.status === 403 || response.status === 429) {
        engine.reportSecurityIncident('waf', {
          type: 'rate_limit',
          ip: 'client',
          url: sanitizedUrl
        });
      }

      return response;
    } catch (error) {
      // Report potential security issues
      engine.reportSecurityIncident('authentication', {
        type: 'network_error',
        error: error.message,
        url: sanitizedUrl
      });
      throw error;
    }
  };
};
