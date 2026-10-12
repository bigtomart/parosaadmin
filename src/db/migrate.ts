import { db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Migration runner: ensures all PostgreSQL tables, indexes, constraints exist idempotently.
 * Safe to run multiple times without data loss.
 */
export async function runMigrationsOnDb(targetDb: any = db) {
  console.log('[PAROSA DB] Running database schema migrations...');

  // 1. Cities
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS cities (
      id VARCHAR(64) PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 2. Permissions
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id VARCHAR(128) PRIMARY KEY,
      resource VARCHAR(64) NOT NULL,
      action VARCHAR(64) NOT NULL,
      category VARCHAR(64) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 3. Roles
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      description TEXT NOT NULL,
      is_system BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      scope_type VARCHAR(32) NOT NULL DEFAULT 'GLOBAL',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 4. Role Permissions
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id VARCHAR(128) PRIMARY KEY,
      role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id VARCHAR(128) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await targetDb.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS role_perm_unique_idx ON role_permissions(role_id, permission_id);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS role_perm_role_idx ON role_permissions(role_id);
  `);

  // 5. Admin Users
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(32) NOT NULL,
      password_hash TEXT NOT NULL,
      role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      scope_type VARCHAR(32) NOT NULL DEFAULT 'GLOBAL',
      status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      avatar_url TEXT,
      last_login TIMESTAMPTZ,
      last_login_ip VARCHAR(64),
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      lockout_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users(role_id);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS admin_users_status_idx ON admin_users(status);
  `);

  // 6. Admin Scopes
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_scopes (
      id VARCHAR(128) PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      scope_type VARCHAR(32) NOT NULL,
      scope_value VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await targetDb.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS admin_scope_unique_idx ON admin_scopes(admin_id, scope_type, scope_value);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS admin_scopes_admin_idx ON admin_scopes(admin_id);
  `);

  // 7. Admin Sessions
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id VARCHAR(128) PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      ip_address VARCHAR(64) NOT NULL,
      user_agent TEXT NOT NULL,
      device TEXT,
      is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS admin_sessions_token_idx ON admin_sessions(token);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS admin_sessions_admin_idx ON admin_sessions(admin_id);
  `);

  // 8. Audit Logs
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(128) PRIMARY KEY,
      admin_id VARCHAR(64) NOT NULL,
      admin_name VARCHAR(128) NOT NULL,
      admin_email VARCHAR(255) NOT NULL,
      admin_role VARCHAR(64) NOT NULL,
      action VARCHAR(128) NOT NULL,
      target_type VARCHAR(64) NOT NULL,
      target_id VARCHAR(128) NOT NULL,
      old_value JSONB,
      new_value JSONB,
      ip_address VARCHAR(64) NOT NULL,
      user_agent TEXT NOT NULL,
      city VARCHAR(64) DEFAULT 'GLOBAL',
      status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
      error_message TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS audit_logs_admin_idx ON audit_logs(admin_id);
  `);
  await targetDb.execute(sql`
    CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
  `);

  // 9. Security Policies
  await targetDb.execute(sql`
    CREATE TABLE IF NOT EXISTS security_policies (
      id VARCHAR(64) PRIMARY KEY,
      session_timeout_minutes INTEGER NOT NULL DEFAULT 30,
      max_failed_attempts INTEGER NOT NULL DEFAULT 5,
      lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
      enforce_2fa_for_privileged BOOLEAN NOT NULL DEFAULT TRUE,
      password_expiry_days INTEGER NOT NULL DEFAULT 90,
      rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NOT NULL DEFAULT 'System'
    );
  `);

  console.log('[PAROSA DB] All PostgreSQL tables and indexes verified successfully.');
}

export async function runMigrations() {
  await runMigrationsOnDb(db);
}

// Allow CLI execution: `npx tsx src/db/migrate.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('[PAROSA DB] Migration complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[PAROSA DB] Migration failed:', err);
      process.exit(1);
    });
}
