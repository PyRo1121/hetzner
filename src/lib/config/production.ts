/**
 * Production Configuration Helper
 * Automatically detects environment and provides correct service URLs
 */

export const isProduction = process.env.NODE_ENV === 'production';
export const isKubernetes = process.env.KUBERNETES_SERVICE_HOST !== undefined;

/**
 * Get database URL based on environment
 */
export function getDatabaseUrl(): string {
  // Kubernetes: Use internal service
  if (isKubernetes || isProduction) {
    return process.env.DATABASE_URL || 
           'postgresql://postgres@postgresql.databases.svc.cluster.local:5432/albion';
  }
  
  // Development: Use localhost or env variable
  return process.env.DATABASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL || 
         'http://localhost:54321';
}

/**
 * Get Redis URL based on environment
 */
export function getRedisUrl(): string {
  // Kubernetes: Use internal service with authentication
  if (isKubernetes || isProduction) {
    const password = process.env.REDIS_PASSWORD || '';
    const host = 'redis-master.databases.svc.cluster.local';
    return password 
      ? `redis://:${password}@${host}:6379`
      : `redis://${host}:6379`;
  }
  
  // Development: Use localhost
  return process.env.REDIS_URL || 'redis://localhost:6379';
}

/**
 * Get Qdrant URL based on environment
 */
export function getQdrantUrl(): string {
  if (isKubernetes || isProduction) {
    return process.env.QDRANT_URL || 
           'http://qdrant.databases.svc.cluster.local:6333';
  }
  
  return process.env.QDRANT_URL || 'http://localhost:6333';
}

/**
 * Get MinIO endpoint based on environment
 */
export function getMinioConfig() {
  if (isKubernetes || isProduction) {
    return {
      endpoint: process.env.MINIO_ENDPOINT || 'minio.databases.svc.cluster.local',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || '',
    };
  }
  
  return {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  };
}

/**
 * Get ML service URL based on environment
 */
export function getMLServiceUrl(): string {
  if (isKubernetes || isProduction) {
    return process.env.ML_SERVICE_URL || 
           'http://ml-service.ml.svc.cluster.local';
  }
  
  return process.env.ML_SERVICE_URL || 'http://localhost:3002';
}

/**
 * Get external API base URLs (these don't change)
 */
export const EXTERNAL_APIS = {
  gameinfo: 'https://gameinfo.albiononline.com/api/gameinfo',
  aodp: 'https://api.albion-online-data.com/api/v2',
  render: 'https://render.albiononline.com/v1',
  openalbion: 'https://api.openalbion.com/v1',
} as const;

/**
 * Cache configuration based on environment
 */
export const CACHE_CONFIG = {
  // In production, use longer TTLs since we have Redis
  defaultTTL: isProduction ? 3600 : 300, // 1 hour vs 5 minutes
  
  // Market data cache (frequently updated)
  marketTTL: isProduction ? 300 : 60, // 5 minutes vs 1 minute
  
  // Kill events cache (real-time data)
  killsTTL: isProduction ? 60 : 30, // 1 minute vs 30 seconds
  
  // Static data cache (rarely changes)
  staticTTL: isProduction ? 86400 : 3600, // 24 hours vs 1 hour
  
  // Image cache (never changes)
  imageTTL: isProduction ? 604800 : 86400, // 7 days vs 1 day
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  // More aggressive rate limiting in production
  windowMs: isProduction ? 60000 : 10000, // 1 minute vs 10 seconds
  maxRequests: isProduction ? 100 : 1000, // 100 vs 1000 requests
};

/**
 * Connection pool configuration
 */
export const POOL_CONFIG = {
  // Larger pools in production
  database: {
    min: isProduction ? 5 : 2,
    max: isProduction ? 20 : 5,
  },
  redis: {
    min: isProduction ? 5 : 2,
    max: isProduction ? 50 : 10,
  },
};

/**
 * Feature flags based on environment
 */
export const FEATURES = {
  // Enable advanced features only in production
  vectorSearch: isProduction,
  mlPredictions: isProduction,
  objectStorage: isProduction,
  advancedCaching: isProduction,
  
  // Always enable these
  realtime: true,
  analytics: true,
};

/**
 * Logging configuration
 */
export const LOG_CONFIG = {
  level: isProduction ? 'info' : 'debug',
  pretty: !isProduction,
  redactSecrets: isProduction,
};

/**
 * Health check configuration
 */
export const HEALTH_CHECK = {
  enabled: isProduction,
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
};
