import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const total = await prisma.companyRecord.count();
const gens = await prisma.companyRecord.groupBy({ by: ['importGeneration'], _count: true });
console.log('total:', total, 'gens:', gens.map(g=>({gen:g.importGeneration.toString(), count:g._count})));
await prisma.$disconnect();
