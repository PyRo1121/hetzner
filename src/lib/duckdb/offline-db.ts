/**
 * DuckDB-WASM Offline Database
 * Enables offline querying and simulation with cached market data
 */

import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

/**
 * Initialize DuckDB-WASM
 */
export async function initDuckDB(): Promise<boolean> {
  if (db) {return true;}

  try {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    
    // Select bundle based on browser support
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    
    URL.revokeObjectURL(worker_url);
    
    conn = await db.connect();
    
    // Create tables for offline data
    await createTables();
    
    console.log('✅ DuckDB-WASM initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ DuckDB-WASM initialization failed:', error);
    return false;
  }
}

/**
 * Create database tables
 */
async function createTables() {
  if (!conn) {throw new Error('Database not initialized');}

  await conn.query(`
    CREATE TABLE IF NOT EXISTS market_prices (
      item_id VARCHAR,
      item_name VARCHAR,
      city VARCHAR,
      quality INTEGER,
      buy_price DOUBLE,
      sell_price DOUBLE,
      quantity INTEGER,
      timestamp TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS simulations (
      id VARCHAR PRIMARY KEY,
      item_id VARCHAR,
      buy_city VARCHAR,
      sell_city VARCHAR,
      buy_price DOUBLE,
      sell_price DOUBLE,
      quantity INTEGER,
      iterations INTEGER,
      mean_profit DOUBLE,
      median_profit DOUBLE,
      std_dev DOUBLE,
      var_95 DOUBLE,
      cvar_95 DOUBLE,
      timestamp TIMESTAMP
    )
  `);

  console.log('✅ Database tables created');
}

/**
 * Cache market data for offline use
 */
export async function cacheMarketData(data: any[]): Promise<void> {
  if (!conn) {
    await initDuckDB();
  }

  if (!conn) {throw new Error('Database not initialized');}

  // Clear old data
  await conn.query('DELETE FROM market_prices');

  // Insert new data
  for (const item of data) {
    await conn.query(`
      INSERT INTO market_prices VALUES (
        '${item.item_id}',
        '${item.item_name}',
        '${item.city}',
        ${item.quality},
        ${item.buy_price},
        ${item.sell_price},
        ${item.quantity},
        CURRENT_TIMESTAMP
      )
    `);
  }

  console.log(`✅ Cached ${data.length} market price records`);
}

/**
 * Query market data offline
 */
export async function queryMarketData(sql: string): Promise<any[]> {
  if (!conn) {
    const initialized = await initDuckDB();
    if (!initialized) {throw new Error('Database initialization failed');}
  }

  const result = await conn!.query(sql);
  return result.toArray().map(row => row.toJSON());
}

/**
 * Save simulation results
 */
export async function saveSimulation(simulation: any): Promise<void> {
  if (!conn) {await initDuckDB();}
  if (!conn) {throw new Error('Database not initialized');}

  await conn.query(`
    INSERT INTO simulations VALUES (
      '${simulation.id}',
      '${simulation.item_id}',
      '${simulation.buy_city}',
      '${simulation.sell_city}',
      ${simulation.buy_price},
      ${simulation.sell_price},
      ${simulation.quantity},
      ${simulation.iterations},
      ${simulation.mean_profit},
      ${simulation.median_profit},
      ${simulation.std_dev},
      ${simulation.var_95},
      ${simulation.cvar_95},
      CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Simulation saved to offline database');
}

/**
 * Get saved simulations
 */
export async function getSavedSimulations(): Promise<any[]> {
  if (!conn) {await initDuckDB();}
  if (!conn) {return [];}

  const result = await conn.query(`
    SELECT * FROM simulations
    ORDER BY timestamp DESC
    LIMIT 100
  `);

  return result.toArray().map(row => row.toJSON());
}

/**
 * Export data as CSV
 */
export async function exportToCSV(tableName: string): Promise<string> {
  if (!conn) {throw new Error('Database not initialized');}

  const result = await conn.query(`
    SELECT * FROM ${tableName}
  `);

  const rows = result.toArray().map(row => row.toJSON());
  if (rows.length === 0) {return '';}

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');

  return csv;
}

/**
 * Run custom SQL query
 */
export async function runQuery(sql: string): Promise<any> {
  if (!conn) {await initDuckDB();}
  if (!conn) {throw new Error('Database not initialized');}

  const result = await conn.query(sql);
  return {
    rows: result.toArray().map(row => row.toJSON()),
    rowCount: result.numRows,
  };
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<any> {
  if (!conn) {await initDuckDB();}
  if (!conn) {return null;}

  const marketCount = await conn.query('SELECT COUNT(*) as count FROM market_prices');
  const simCount = await conn.query('SELECT COUNT(*) as count FROM simulations');

  return {
    marketPrices: marketCount.toArray()[0].toJSON().count,
    simulations: simCount.toArray()[0].toJSON().count,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Close database connection
 */
export async function closeDuckDB(): Promise<void> {
  if (conn) {
    await conn.close();
    conn = null;
  }
  if (db) {
    await db.terminate();
    db = null;
  }
  console.log('✅ DuckDB-WASM closed');
}
