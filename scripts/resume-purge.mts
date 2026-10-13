/**
 * Deletes résumé requests (and their audit events) with no activity for the retention period (365 days).
 * Usage: npm run resume:purge   (run it now and then, e.g. monthly)
 */
import { purgeOldResumeRecords } from '../src/lib/resume-store.server.ts';

const count = await purgeOldResumeRecords();
console.log(`Deleted ${count} résumé request${count === 1 ? '' : 's'} past the retention period.`);
process.exit(0);
