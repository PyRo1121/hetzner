#!/usr/bin/env node

/**
 * ao-bin Data Integration - Enterprise CDN Storage & Sync
 * October 2025 - World-Class Data Management
 *
 * This script provides comprehensive ao-bin JSON data integration with
 * enterprise-grade CDN storage and real-time synchronization.
 *
 * Features:
 * - Automated ao-bin data synchronization
 * - CDN storage with Cloudflare R2 integration
 * - Real-time data serving with Redis caching
 * - Data validation and integrity checks
 * - Comprehensive error handling and monitoring
 * - Multi-region CDN distribution
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('redis');
const winston = require('winston');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const config = {
  aoBin: {
    baseURL: 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/',
    files: [
      'items.json',
      'spells.json',
      'npcs.json',
      'world.json',
      'fame.json',
      'mobs.json',
      'gatherables.json'
    ],
    syncInterval: 3600000, // 1 hour
    retryAttempts: 3,
    timeout: 30000
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },
  cdn: {
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET || 'albion-data',
    region: process.env.S3_REGION || 'auto',
    publicURL: process.env.CDN_PUBLIC_URL || 'https://cdn.pyro1121.com'
  },
  localCache: {
    dir: process.env.CACHE_DIR || '/tmp/ao-bin-cache',
    ttl: 86400000 // 24 hours
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || '/var/log/ao-bin-integration.log'
  }
};

// Validate configuration
function validateConfig() {
  const required = [
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'REDIS_PASSWORD'
  ];

  const optional = [
    'S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'
  ];

  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }

  // Warn about missing CDN config
  for (const env of optional) {
    if (!process.env[env]) {
      console.warn(`Optional environment variable not set: ${env}`);
    }
  }
}

// Initialize logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize clients
let supabase, redis, s3Client;

// Initialize S3 client for Cloudflare R2
function initS3Client() {
  if (!config.cdn.accessKey || !config.cdn.secretKey) {
    logger.warn('CDN credentials not provided, CDN uploads will be skipped');
    return null;
  }

  return new S3Client({
    region: config.cdn.region,
    endpoint: config.cdn.endpoint,
    credentials: {
      accessKeyId: config.cdn.accessKey,
      secretAccessKey: config.cdn.secretKey
    }
  });
}

// Data validation and processing
class AoBinDataProcessor {
  constructor() {
    this.schemas = {
      items: this.validateItems.bind(this),
      spells: this.validateSpells.bind(this),
      npcs: this.validateNpcs.bind(this),
      world: this.validateWorld.bind(this)
    };
  }

  validateItems(data) {
    if (!Array.isArray(data)) {
      throw new Error('Items data must be an array');
    }

    // Validate first few items for structure
    const sampleItems = data.slice(0, 5);
    for (const item of sampleItems) {
      if (!item.UniqueName || typeof item.LocalizedNames !== 'object') {
        throw new Error(`Invalid item structure: ${JSON.stringify(item)}`);
      }
    }

    return data;
  }

  validateSpells(data) {
    if (!Array.isArray(data)) {
      throw new Error('Spells data must be an array');
    }
    return data;
  }

  validateNpcs(data) {
    if (!Array.isArray(data)) {
      throw new Error('NPCs data must be an array');
    }
    return data;
  }

  validateWorld(data) {
    if (typeof data !== 'object') {
      throw new Error('World data must be an object');
    }
    return data;
  }

  processFile(fileName, data) {
    const validator = this.schemas[path.parse(fileName).name];
    if (validator) {
      return validator(data);
    }

    // Default validation for unknown files
    if (typeof data !== 'object') {
      throw new Error(`Invalid data type for ${fileName}`);
    }

    return data;
  }

  calculateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

const dataProcessor = new AoBinDataProcessor();

// CDN operations
class CDNManager {
  constructor(s3Client) {
    this.s3Client = s3Client;
    this.cache = new Map();
  }

  async uploadFile(key, data, contentType = 'application/json') {
    if (!this.s3Client) {
      logger.warn(`CDN upload skipped for ${key}: S3 client not initialized`);
      return null;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: config.cdn.bucket,
        Key: key,
        Body: typeof data === 'string' ? data : JSON.stringify(data),
        ContentType: contentType,
        CacheControl: 'max-age=3600', // 1 hour cache
        Metadata: {
          'uploaded-at': new Date().toISOString(),
          'source': 'ao-bin-integration'
        }
      });

      await this.s3Client.send(command);

      const publicUrl = `${config.cdn.publicURL}/${key}`;
      logger.info(`File uploaded to CDN: ${key} -> ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      logger.error(`CDN upload failed for ${key}`, { error: error.message });
      throw error;
    }
  }

  async fileExists(key) {
    if (!this.s3Client) return false;

    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: config.cdn.bucket,
        Key: key
      }));
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  getPublicUrl(key) {
    return `${config.cdn.publicURL}/${key}`;
  }
}

// ao-bin synchronization
class AoBinSynchronizer {
  constructor() {
    this.lastSync = new Map();
    this.cdnManager = new CDNManager(s3Client);
  }

  async syncFile(fileName, options = {}) {
    const maxRetries = options.maxRetries || config.aoBin.retryAttempts;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const url = `${config.aoBin.baseURL}${fileName}`;
        logger.info(`Downloading ${fileName} from ao-bin`, { attempt: attempt + 1, url });

        const response = await axios.get(url, {
          timeout: config.aoBin.timeout,
          headers: {
            'User-Agent': 'Albion-ao-bin-Integration/1.0.0'
          }
        });

        const data = response.data;
        const hash = dataProcessor.calculateHash(data);

        // Validate data structure
        const processedData = dataProcessor.processFile(fileName, data);

        // Check if data has changed
        const lastHash = await redis.get(`ao_bin:hash:${fileName}`);
        if (lastHash === hash && !options.force) {
          logger.info(`No changes detected for ${fileName}, skipping update`);
          return { status: 'unchanged', hash };
        }

        // Store in Supabase
        const { error } = await supabase
          .from('ao_bin_data')
          .upsert({
            file_name: fileName,
            data: processedData,
            hash: hash,
            size_bytes: JSON.stringify(data).length,
            updated_at: new Date()
          }, { onConflict: 'file_name' });

        if (error) throw error;

        // Cache in Redis (24 hours)
        await redis.setex(`ao_bin:data:${fileName}`, 86400, JSON.stringify(processedData));
        await redis.setex(`ao_bin:hash:${fileName}`, 86400, hash);

        // Upload to CDN
        const cdnKey = `ao-bin/${fileName}`;
        const cdnUrl = await this.cdnManager.uploadFile(cdnKey, processedData);

        // Update CDN URL in database
        if (cdnUrl) {
          await supabase
            .from('ao_bin_data')
            .update({ cdn_url: cdnUrl })
            .eq('file_name', fileName);
        }

        // Local cache for faster access
        await this.cacheLocally(fileName, processedData);

        logger.info(`Successfully synced ${fileName}`, {
          hash,
          size: JSON.stringify(data).length,
          cdnUrl
        });

        this.lastSync.set(fileName, new Date());
        return { status: 'updated', hash, cdnUrl };

      } catch (error) {
        attempt++;
        logger.error(`Failed to sync ${fileName} (attempt ${attempt}/${maxRetries})`, {
          error: error.message,
          url: `${config.aoBin.baseURL}${fileName}`
        });

        if (attempt >= maxRetries) {
          throw new Error(`Failed to sync ${fileName} after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  async syncAllFiles(options = {}) {
    const results = {};
    const startTime = Date.now();

    logger.info('Starting ao-bin data synchronization', {
      files: config.aoBin.files.length,
      force: options.force || false
    });

    for (const fileName of config.aoBin.files) {
      try {
        results[fileName] = await this.syncFile(fileName, options);
      } catch (error) {
        results[fileName] = { status: 'error', error: error.message };
        logger.error(`Failed to sync ${fileName}`, { error: error.message });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = Object.values(results).filter(r => r.status === 'updated').length;
    const unchangedCount = Object.values(results).filter(r => r.status === 'unchanged').length;
    const errorCount = Object.values(results).filter(r => r.status === 'error').length;

    logger.info('ao-bin synchronization completed', {
      duration: `${duration}ms`,
      updated: successCount,
      unchanged: unchangedCount,
      errors: errorCount,
      results
    });

    return {
      duration,
      results,
      summary: { successCount, unchangedCount, errorCount }
    };
  }

  async cacheLocally(fileName, data) {
    try {
      await fs.mkdir(config.localCache.dir, { recursive: true });
      const filePath = path.join(config.localCache.dir, fileName);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      logger.debug(`Cached ${fileName} locally`, { path: filePath });
    } catch (error) {
      logger.warn(`Failed to cache ${fileName} locally`, { error: error.message });
    }
  }

  async getCachedData(fileName) {
    // Try Redis cache first
    const redisData = await redis.get(`ao_bin:data:${fileName}`);
    if (redisData) {
      return JSON.parse(redisData);
    }

    // Try local cache
    try {
      const filePath = path.join(config.localCache.dir, fileName);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);

      // Refresh Redis cache
      await redis.setex(`ao_bin:data:${fileName}`, 86400, JSON.stringify(parsed));

      return parsed;
    } catch (error) {
      // Try database
      const { data, error } = await supabase
        .from('ao_bin_data')
        .select('data')
        .eq('file_name', fileName)
        .single();

      if (error || !data) {
        throw new Error(`No cached data found for ${fileName}`);
      }

      // Refresh caches
      await redis.setex(`ao_bin:data:${fileName}`, 86400, JSON.stringify(data.data));
      await this.cacheLocally(fileName, data.data);

      return data.data;
    }
  }
}

const synchronizer = new AoBinSynchronizer();

// Health monitoring
async function healthCheck() {
  const health = {
    timestamp: new Date(),
    redis: false,
    supabase: false,
    cdn: false,
    aoBin: false
  };

  try {
    await redis.ping();
    health.redis = true;
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message });
  }

  try {
    const { data } = await supabase.from('ao_bin_data').select('count').limit(1);
    health.supabase = true;
  } catch (error) {
    logger.error('Supabase health check failed', { error: error.message });
  }

  try {
    if (s3Client) {
      await s3Client.send(new HeadObjectCommand({
        Bucket: config.cdn.bucket,
        Key: 'health-check'
      }));
    }
    health.cdn = true;
  } catch (error) {
    if (error.name !== 'NotFound') {
      logger.error('CDN health check failed', { error: error.message });
    } else {
      health.cdn = true; // Bucket exists, file doesn't (expected)
    }
  }

  try {
    await axios.get(config.aoBin.baseURL, { timeout: 5000 });
    health.aoBin = true;
  } catch (error) {
    logger.error('ao-bin repository health check failed', { error: error.message });
  }

  // Store health status
  await redis.setex('health:ao-bin-integration', 300, JSON.stringify(health));

  return health;
}

// API endpoints for data serving
async function serveDataEndpoint(fileName) {
  try {
    const data = await synchronizer.getCachedData(fileName);
    return { status: 'success', data };
  } catch (error) {
    logger.error(`Failed to serve data for ${fileName}`, { error: error.message });
    return { status: 'error', error: error.message };
  }
}

// Main synchronization loop
async function startSynchronization() {
  logger.info('Starting ao-bin Enterprise Integration Service');
  logger.info('Configuration:', {
    aoBinURL: config.aoBin.baseURL,
    files: config.aoBin.files,
    syncInterval: config.aoBin.syncInterval,
    cdnEnabled: !!s3Client,
    redis: { host: config.redis.host, port: config.redis.port },
    supabase: { url: config.supabase.url }
  });

  // Initialize connections
  redis = Redis.createClient(config.redis);
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  s3Client = initS3Client();

  await redis.connect();

  // Initial synchronization
  logger.info('Performing initial ao-bin data synchronization...');
  await synchronizer.syncAllFiles({ force: true });

  // Initial health check
  await healthCheck();

  // Scheduled synchronization
  const interval = setInterval(async () => {
    try {
      await synchronizer.syncAllFiles();
      await healthCheck();
    } catch (error) {
      logger.error('Scheduled synchronization failed', { error: error.message });
    }
  }, config.aoBin.syncInterval);

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down ao-bin integration gracefully`);

    clearInterval(interval);

    try {
      await redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', { error: error.message });
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('ao-bin integration service started successfully');
}

// CLI interface
async function main() {
  const command = process.argv[2];

  try {
    validateConfig();

    switch (command) {
      case 'sync':
        await startSynchronization();
        break;

      case 'sync-once':
        redis = Redis.createClient(config.redis);
        supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
        s3Client = initS3Client();
        await redis.connect();

        const result = await synchronizer.syncAllFiles();
        console.log(JSON.stringify(result, null, 2));
        await redis.quit();
        break;

      case 'health':
        redis = Redis.createClient(config.redis);
        supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
        s3Client = initS3Client();
        await redis.connect();

        const health = await healthCheck();
        console.log(JSON.stringify(health, null, 2));
        await redis.quit();
        break;

      case 'serve':
        const fileName = process.argv[3];
        if (!fileName) {
          console.error('Usage: node ao-bin-integration.js serve <filename>');
          process.exit(1);
        }

        redis = Redis.createClient(config.redis);
        supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
        await redis.connect();

        const data = await serveDataEndpoint(fileName);
        console.log(JSON.stringify(data, null, 2));
        await redis.quit();
        break;

      default:
        console.log('Usage:');
        console.log('  node ao-bin-integration.js sync          # Start continuous sync service');
        console.log('  node ao-bin-integration.js sync-once     # Sync once and exit');
        console.log('  node ao-bin-integration.js health        # Check service health');
        console.log('  node ao-bin-integration.js serve <file>  # Serve cached data for file');
        process.exit(1);
    }
  } catch (error) {
    logger.error('ao-bin integration failed', { error: error.message });
    console.error(error.message);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  AoBinSynchronizer,
  CDNManager,
  AoBinDataProcessor,
  healthCheck
};
