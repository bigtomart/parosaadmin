import { createDatabaseBackup } from '../src/db/backupAndMigrate';

async function main() {
  console.log('--- EXECUTING ZERO-LOSS DATABASE BACKUP ---');
  const res = await createDatabaseBackup();
  console.log('Backup written to:', res.backupPath);
  console.log('Record counts:', res.payload.counts);
  process.exit(0);
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
