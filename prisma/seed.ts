import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { hash } from '@node-rs/argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for Prisma seed');

const adminPassword = process.env.ADMIN_SEED_PASSWORD;
const demoPassword = process.env.DEMO_SEED_PASSWORD;
if (!adminPassword || adminPassword.length < 16) {
  throw new Error('ADMIN_SEED_PASSWORD must be configured with at least 16 characters');
}
if (!demoPassword || demoPassword.length < 16) {
  throw new Error('DEMO_SEED_PASSWORD must be configured with at least 16 characters');
}

const adminSeedPassword: string = adminPassword;
const demoSeedPassword: string = demoPassword;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const systemAccounts = [
    { accountNumber: 'SYS:CASH', type: 'current' as const, isSystem: true },
    { accountNumber: 'SYS:INTEREST_INCOME', type: 'current' as const, isSystem: true },
    { accountNumber: 'SYS:FEE_INCOME', type: 'current' as const, isSystem: true },
    { accountNumber: 'SYS:LOAN_POOL', type: 'current' as const, isSystem: true },
  ];

  for (const acct of systemAccounts) {
    await prisma.account.upsert({
      where: { accountNumber: acct.accountNumber },
      update: {},
      create: { ...acct, currency: 'USD', status: 'active' },
    });
  }

  const [adminHash, demoHash] = await Promise.all([
    hash(adminSeedPassword),
    hash(demoSeedPassword),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@solidtrust.finance' },
    update: { role: 'admin' },
    create: {
      email: 'admin@solidtrust.finance',
      fullName: 'SolidTrust Admin',
      passwordHash: adminHash,
      role: 'admin',
      emailVerified: new Date(),
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@solidtrust.finance' },
    update: {},
    create: {
      email: 'demo@solidtrust.finance',
      fullName: 'Demo Customer',
      passwordHash: demoHash,
      role: 'customer',
      emailVerified: new Date(),
    },
  });

  await prisma.account.upsert({
    where: { accountNumber: 'ST-DEMO-0001' },
    update: {},
    create: {
      userId: demo.id,
      accountNumber: 'ST-DEMO-0001',
      type: 'savings',
      currency: 'USD',
      status: 'active',
    },
  });

  console.log('Seed complete. Admin:', admin.email, 'Demo:', demo.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
