import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlUser = process.env.SQL_USER || process.env.SQL_ADMIN_USER;
const sqlPassword = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD;
const sqlDbName = process.env.SQL_DB_NAME;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(connectionString
    ? {
        dbCredentials: {
          url: connectionString,
        },
      }
    : sqlHost && sqlUser && sqlDbName
      ? {
          dbCredentials: {
            host: sqlHost,
            user: sqlUser,
            password: sqlPassword || '',
            database: sqlDbName,
            ssl: false,
          },
        }
      : {
          dbCredentials: {
            url: 'postgres://postgres:postgres@localhost:5432/parosa',
          },
        }),
  verbose: true,
  strict: true,
});
