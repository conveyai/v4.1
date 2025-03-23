// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.document.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.matter.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.conveyancer.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log('Creating tenants...');
  // Create tenants
  const acmeLaw = await prisma.tenant.create({
    data: {
      name: 'Acme Law Firm',
      domain: 'acmelaw.com',
    },
  });

  const betterConveyancing = await prisma.tenant.create({
    data: {
      name: 'Better Conveyancing',
      domain: 'betterconveyancing.com',
    },
  });

  console.log('Creating conveyancers...');
  // Hash passwords
  const password = await bcrypt.hash('password123', 10);

  // Create conveyancers for Acme Law
  const john = await prisma.conveyancer.create({
    data: {
      name: 'John Smith',
      email: 'john@acmelaw.com',
      password_hash: password,
      tenantId: acmeLaw.id,
    },
  });

  const jane = await prisma.conveyancer.create({
    data: {
      name: 'Jane Doe',
      email: 'jane@acmelaw.com',
      password_hash: password,
      tenantId: acmeLaw.id,
    },
  });

  // Create conveyancers for Better Conveyancing
  const michael = await prisma.conveyancer.create({
    data: {
      name: 'Michael Johnson',
      email: 'michael@betterconveyancing.com',
      password_hash: password,
      tenantId: betterConveyancing.id,
    },
  });

  console.log('Creating clients...');
  // Create clients for Acme Law
  const acmeClients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        phone: '0412345678',
        tenantId: acmeLaw.id,
        identity_verified: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Bob Baker',
        email: 'bob@example.com',
        phone: '0423456789',
        tenantId: acmeLaw.id,
        identity_verified: false,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Charlie Chen',
        email: 'charlie@example.com',
        phone: '0434567890',
        tenantId: acmeLaw.id,
        identity_verified: true,
      },
    }),
  ]);

  // Create clients for Better Conveyancing
  const betterClients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'David Davidson',
        email: 'david@example.com',
        phone: '0445678901',
        tenantId: betterConveyancing.id,
        identity_verified: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Eve Edwards',
        email: 'eve@example.com',
        phone: '0456789012',
        tenantId: betterConveyancing.id,
        identity_verified: true,
      },
    }),
  ]);

  console.log('Creating properties for John...');
  // Create properties for John
  const johnProperties = await Promise.all([
    prisma.property.create({
      data: {
        address: '123 Main Street, Sydney NSW 2000',
        status: 'Available',
        listing_price: 850000,
        tenantId: acmeLaw.id,
        conveyancerId: john.id,
      },
    }),
    prisma.property.create({
      data: {
        address: '456 Park Avenue, Melbourne VIC 3000',
        status: 'Pending',
        listing_price: 1200000,
        tenantId: acmeLaw.id,
        conveyancerId: john.id,
      },
    }),
  ]);

  console.log('Creating properties for Jane...');
  // Create properties for Jane
  const janeProperties = await Promise.all([
    prisma.property.create({
      data: {
        address: '789 George Street, Brisbane QLD 4000',
        status: 'Sold',
        listing_price: 670000,
        tenantId: acmeLaw.id,
        conveyancerId: jane.id,
      },
    }),
  ]);

  console.log('Creating properties for Michael...');
  // Create properties for Michael at Better Conveyancing
  const michaelProperties = await Promise.all([
    prisma.property.create({
      data: {
        address: '101 Elizabeth Street, Perth WA 6000',
        status: 'Available',
        listing_price: 925000,
        tenantId: betterConveyancing.id,
        conveyancerId: michael.id,
      },
    }),
    prisma.property.create({
      data: {
        address: '202 Collins Street, Adelaide SA 5000',
        status: 'Pending',
        listing_price: 780000,
        tenantId: betterConveyancing.id,
        conveyancerId: michael.id,
      },
    }),
  ]);

  console.log('Creating matters for John...');
  // Create matters for John
  const johnMatters = await Promise.all([
    prisma.matter.create({
      data: {
        type: 'Purchase',
        date: new Date('2023-12-15'),
        settlement_date: new Date('2024-01-30'),
        amount: 850000,
        status: 'Pending',
        tenantId: acmeLaw.id,
        conveyancerId: john.id,
        propertyId: johnProperties[0].id,
        buyerId: acmeClients[0].id,
        sellerId: acmeClients[1].id,
      },
    }),
    prisma.matter.create({
      data: {
        type: 'Sale',
        date: new Date('2023-11-20'),
        settlement_date: new Date('2024-01-15'),
        amount: 1200000,
        status: 'Completed',
        tenantId: acmeLaw.id,
        conveyancerId: john.id,
        propertyId: johnProperties[1].id,
        buyerId: acmeClients[2].id,
        sellerId: acmeClients[0].id,
      },
    }),
  ]);

  console.log('Creating matters for Jane...');
  // Create matters for Jane
  const janeMatters = await Promise.all([
    prisma.matter.create({
      data: {
        type: 'Purchase',
        date: new Date('2023-10-10'),
        settlement_date: new Date('2023-12-05'),
        amount: 670000,
        status: 'Completed',
        tenantId: acmeLaw.id,
        conveyancerId: jane.id,
        propertyId: janeProperties[0].id,
        buyerId: acmeClients[1].id,
        sellerId: acmeClients[2].id,
      },
    }),
  ]);

  console.log('Creating matters for Michael...');
  // Create matters for Michael
  const michaelMatters = await Promise.all([
    prisma.matter.create({
      data: {
        type: 'Sale',
        date: new Date('2024-01-05'),
        settlement_date: new Date('2024-02-20'),
        amount: 925000,
        status: 'Pending',
        tenantId: betterConveyancing.id,
        conveyancerId: michael.id,
        propertyId: michaelProperties[0].id,
        buyerId: betterClients[0].id,
        sellerId: betterClients[1].id,
      },
    }),
    prisma.matter.create({
      data: {
        type: 'Purchase',
        date: new Date('2023-12-01'),
        settlement_date: new Date('2024-01-25'),
        amount: 780000,
        status: 'Completed',
        tenantId: betterConveyancing.id,
        conveyancerId: michael.id,
        propertyId: michaelProperties[1].id,
        buyerId: betterClients[1].id,
        sellerId: betterClients[0].id,
      },
    }),
  ]);

  // Create an archived matter
  console.log('Creating archived matter...');
  await prisma.matter.create({
    data: {
      type: 'Sale',
      date: new Date('2023-06-15'),
      settlement_date: new Date('2023-08-01'),
      amount: 555000,
      status: 'Completed',
      archived_at: new Date('2023-09-01'),
      tenantId: acmeLaw.id,
      conveyancerId: john.id,
      propertyId: johnProperties[0].id,
      buyerId: acmeClients[2].id,
      sellerId: acmeClients[1].id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Created:');
  console.log(`- 2 tenants`);
  console.log(`- 3 conveyancers`);
  console.log(`- ${acmeClients.length + betterClients.length} clients`);
  console.log(`- ${johnProperties.length + janeProperties.length + michaelProperties.length} properties`);
  console.log(`- ${johnMatters.length + janeMatters.length + michaelMatters.length + 1} matters (including 1 archived)`);
  
  // Print login information
  console.log('\nYou can log in with the following credentials:');
  console.log('Email: john@acmelaw.com / Firm Domain: acmelaw.com / Password: password123');
  console.log('Email: jane@acmelaw.com / Firm Domain: acmelaw.com / Password: password123');
  console.log('Email: michael@betterconveyancing.com / Firm Domain: betterconveyancing.com / Password: password123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });