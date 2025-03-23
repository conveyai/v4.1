// scripts/create-test-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create test tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Test Firm",
      domain: "test.com"
    }
  });
  
  console.log("Created tenant:", tenant);
  
  // Create test user with password "password123"
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const user = await prisma.conveyancer.create({
    data: {
      tenantId: tenant.id,
      name: "Test User",
      email: "test@example.com",
      password_hash: hashedPassword
    }
  });
  
  console.log("Created user:", user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });