import { Pool } from 'pg';
import { drizzle as drizzlePg, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite, PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';
import * as path from 'path';
import * as fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

export type ParosaDatabase = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

let _db: ParosaDatabase | null = null;
let _pool: Pool | null = null;
let _pgliteInstance: PGlite | null = null;
let _engineType: 'POSTGRES_REMOTE' | 'POSTGRES_EMBEDDED' = 'POSTGRES_EMBEDDED';
const _dbStartTime: number = Date.now();

export function getDatabaseStartTime(): number {
  return _dbStartTime;
}

export function getEngineType(): 'POSTGRES_REMOTE' | 'POSTGRES_EMBEDDED' {
  return _engineType;
}

export interface DatabaseConfigStatus {
  hasValidRemoteUri: boolean;
  isHttpsSupabaseUrl: boolean;
  rawScheme?: string;
  error?: string;
  maskedHost?: string;
}

export function inspectDatabaseConfig(): DatabaseConfigStatus {
  const dbUrl = process.env.DATABASE_URL;

  if (typeof dbUrl === 'string' && dbUrl.trim() !== '') {
    const trimmed = dbUrl.trim();
    if (trimmed.startsWith('https://') && trimmed.includes('supabase.co')) {
      try {
        const u = new URL(trimmed);
        return {
          hasValidRemoteUri: false,
          isHttpsSupabaseUrl: true,
          rawScheme: 'https:',
          maskedHost: u.hostname,
          error:
            'DATABASE_URL is set to an HTTPS Supabase project URL (https://...), not a PostgreSQL connection URI (postgresql://...). The PostgreSQL driver requires a connection string such as postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require.',
        };
      } catch {
        return {
          hasValidRemoteUri: false,
          isHttpsSupabaseUrl: true,
          error: 'DATABASE_URL is set to an HTTPS URL, not a PostgreSQL connection URI.',
        };
      }
    }

    if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
      try {
        const u = new URL(trimmed);
        return {
          hasValidRemoteUri: true,
          isHttpsSupabaseUrl: false,
          rawScheme: u.protocol,
          maskedHost: u.hostname,
        };
      } catch (err: any) {
        return {
          hasValidRemoteUri: false,
          isHttpsSupabaseUrl: false,
          error: `DATABASE_URL could not be parsed: ${err.message}`,
        };
      }
    }
  }

  const hasExplicitHost = !!(
    process.env.SQL_HOST &&
    (process.env.SQL_USER || process.env.SQL_ADMIN_USER) &&
    (process.env.SQL_DB_NAME || process.env.SQL_DATABASE)
  );

  if (hasExplicitHost) {
    return {
      hasValidRemoteUri: true,
      isHttpsSupabaseUrl: false,
      maskedHost: process.env.SQL_HOST,
    };
  }

  return {
    hasValidRemoteUri: false,
    isHttpsSupabaseUrl: false,
    error: 'No remote PostgreSQL connection string or host specified.',
  };
}

export function isPostgresConfigured(): boolean {
  return inspectDatabaseConfig().hasValidRemoteUri;
}

export function initDatabase(): ParosaDatabase {
  if (_db) return _db;

  const configStatus = inspectDatabaseConfig();
  const isProduction = process.env.NODE_ENV === 'production';
  const requireRemote = process.env.REQUIRE_REMOTE_DB === 'true' || isProduction;

  // Strict check: Do not silently fall back to embedded database in production!
  if (requireRemote && !configStatus.hasValidRemoteUri) {
    const errorMsg = configStatus.isHttpsSupabaseUrl
      ? `[PAROSA PRODUCTION FATAL] DATABASE_URL is set to an HTTPS Supabase project URL ("https://${configStatus.maskedHost || '...'}") instead of a PostgreSQL URI ("postgresql://..."). Silent fallback to embedded database is disabled in production. Set a valid Supabase Transaction Pooler URI.`
      : `[PAROSA PRODUCTION FATAL] Production database configuration missing! Valid PostgreSQL URI (DATABASE_URL) required. Silent fallback disabled.`;

    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (configStatus.hasValidRemoteUri) {
    console.log('[PAROSA DB] Connecting to remote PostgreSQL database instance...');
    _engineType = 'POSTGRES_REMOTE';
    if (process.env.DATABASE_URL) {
      const isSupabase =
        process.env.DATABASE_URL.includes('supabase.co') ||
        process.env.DATABASE_URL.includes('supabase.com');

      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        connectionTimeoutMillis: 10000,
        ssl: isSupabase || process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      _pool = new Pool({
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
        password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
        database: process.env.SQL_DB_NAME || process.env.SQL_DATABASE,
        max: 10,
        connectionTimeoutMillis: 10000,
        ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
      });
    }

    _pool.on('error', (err) => {
      console.error('[PAROSA DB POOL ERROR]:', err);
    });

    _db = drizzlePg(_pool, { schema });
    return _db;
  }

  if (configStatus.isHttpsSupabaseUrl) {
    console.warn(
      `[PAROSA DB WARNING] DATABASE_URL contains an HTTPS project URL ("https://${configStatus.maskedHost}"). A PostgreSQL URI is required to connect to Supabase PostgreSQL. Falling back to embedded PostgreSQL (PGlite) for development session only.`
    );
  }

  // Embedded PostgreSQL (PGlite) Engine for Local Dev and Isolated Testing
  console.log('[PAROSA DB] Initializing embedded PostgreSQL (PGlite) relational engine...');
  _engineType = 'POSTGRES_EMBEDDED';
  _pgliteInstance = process.env.PG_DATA_DIR ? new PGlite(process.env.PG_DATA_DIR) : new PGlite();
  _db = drizzlePglite(_pgliteInstance, { schema });
  return _db;
}

// Proxy wrapper ensuring db calls always target the currently initialized database instance
export const db: ParosaDatabase = new Proxy({} as any, {
  get(_target, prop) {
    const active = initDatabase();
    const val = (active as any)[prop];
    if (typeof val === 'function') {
      return val.bind(active);
    }
    return val;
  },
});

export async function closeDatabase(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
  if (_pgliteInstance) {
    await _pgliteInstance.close();
    _pgliteInstance = null;
  }
  _db = null;
}
