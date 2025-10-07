import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { type PostgrestError } from '@supabase/supabase-js';
import { backend } from '@/backend';

type SchemaSyncResult = {
  statementsAttempted: number;
  statementsSucceeded: number;
  errors: { statement: string; error: PostgrestError | Error }[];
};

const supabase = backend.admin;

async function executeStatement(statement: string): Promise<PostgrestError | null> {
  if (!statement.trim()) {
    return null;
  }

  const { error } = await supabase.rpc('exec', { query: `${statement.trim()};` });
  return error;
}

export async function runSchemaMigration(): Promise<SchemaSyncResult> {
  const sqlPath = join(process.cwd(), 'supabase', 'migrations', 'create_pvp_tables.sql');
  const sql = await readFile(sqlPath, 'utf-8');

  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  const result: SchemaSyncResult = {
    statementsAttempted: statements.length,
    statementsSucceeded: 0,
    errors: [],
  };

  for (const statement of statements) {
    try {
      const error = await executeStatement(statement);
      if (error) {
        result.errors.push({ statement, error });
      } else {
        result.statementsSucceeded++;
      }
    } catch (error) {
      result.errors.push({ statement, error: error as Error });
    }
  }

  return result;
}
