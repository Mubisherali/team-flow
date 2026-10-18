const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  
  // Using the correct table name: "tasks"
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "tasks" SET "completedAt" = "updatedAt" WHERE status = 'DONE' AND "completedAt" IS NULL;`
  );
  
  console.log(`✅ Success! Updated ${result} tasks.`);

  // Verify
  const check = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int FROM "tasks" WHERE status = 'DONE' AND "completedAt" IS NULL;`
  );
  
  console.log(`Remaining DONE tasks without timestamp: ${check[0].count}`);
}

main()
  .catch((e) => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());