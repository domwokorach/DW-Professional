import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const total = await prisma.companyRecord.count();
console.log(new Date().toISOString(), 'total:', total);
await prisma.$disconnect();
