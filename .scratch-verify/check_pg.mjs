import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const activity = await prisma.$queryRawUnsafe(`
  SELECT pid, state, (now() - query_start)::text as duration, left(query, 100) as query
  FROM pg_stat_activity WHERE datname = current_database() AND state != 'idle' ORDER BY query_start
`);
console.log(activity);
await prisma.$disconnect();
