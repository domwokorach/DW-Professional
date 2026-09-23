import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const total = await prisma.companyRecord.count();
const gens = await prisma.companyRecord.groupBy({ by: ['importGeneration'], _count: true, orderBy: {importGeneration: 'desc'} });
console.log('total:', total);
console.log('gens:', gens.map(g=>({gen:g.importGeneration.toString(), count:g._count})));
const minMax = await prisma.companyRecord.aggregate({ _min: { createdAt: true, updatedAt: true }, _max: { createdAt: true, updatedAt: true } });
console.log(minMax);
await prisma.$disconnect();
