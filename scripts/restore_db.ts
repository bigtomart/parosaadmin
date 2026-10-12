import { restoreDatabaseFromBackup } from '../src/db/backupAndMigrate';

async function main() {
  console.log('--- EXECUTING ZERO-LOSS DATABASE RESTORE ---');
  const targetFile = process.argv[2];
  const res = await restoreDatabaseFromBackup(targetFile);
  console.log('Restore Status:', res.success ? 'SUCCESS' : 'FAILED');
  console.log('Message:', res.message);
  console.log('Source:', res.sourceFile);
  console.log('Restored Record Counts:', res.counts);
  process.exit(res.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Database restore error:', err);
  process.exit(1);
});
