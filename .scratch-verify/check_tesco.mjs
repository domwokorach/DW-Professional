import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tescoPlc = await prisma.companyRecord.findMany({ where: { nameNormalized: { startsWith: 'tesco' } }, take: 10, select: { companyNumber: true, name: true } });
console.log('Names starting with tesco:', tescoPlc);
await prisma.$disconnect();
