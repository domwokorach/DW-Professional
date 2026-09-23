import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const total = await prisma.companyRecord.count();
console.log('TOTAL:', total);

const dupes = await prisma.$queryRawUnsafe(`
  SELECT "companyNumber", COUNT(*) c FROM "CompanyRecord" GROUP BY "companyNumber" HAVING COUNT(*) > 1 LIMIT 10
`);
console.log('DUPLICATES:', dupes);

const leadingZero = await prisma.companyRecord.count({ where: { companyNumber: { startsWith: '0' } } });
console.log('Leading-zero company numbers:', leadingZero);

const sampleZero = await prisma.companyRecord.findMany({ where: { companyNumber: { startsWith: '0' } }, take: 3 });
console.log('Sample leading-zero rows:', sampleZero.map(r => r.companyNumber + ' | ' + r.name));

const barclays = await prisma.companyRecord.findMany({ where: { nameNormalized: { contains: 'barclays' } }, take: 5, select: { companyNumber: true, name: true, status: true } });
console.log('BARCLAYS:', barclays);

const tesco = await prisma.companyRecord.findMany({ where: { nameNormalized: { contains: 'tesco' } }, take: 5, select: { companyNumber: true, name: true, status: true } });
console.log('TESCO:', tesco);

const specific = await prisma.companyRecord.findUnique({ where: { companyNumber: '00048839' } });
console.log('00048839:', specific);

const withPostcode = await prisma.companyRecord.findFirst({ where: { postalCode: { not: null } }, select: { postalCode: true, name: true, companyNumber: true } });
console.log('Sample postcode row:', withPostcode);

await prisma.$disconnect();
