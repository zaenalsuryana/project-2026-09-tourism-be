import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedUsers } from './data/user.seed'; // Cukup import user.seed

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Membersihkan data lama berdasarkan urutan relasi (Child -> Parent)
  console.log('🗑️  Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketInventory.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.authToken.deleteMany();
  await prisma.userIdentity.deleteMany();
  await prisma.user.deleteMany();

  // 2. Jalankan Seeder User (tanpa argumen position ID)
  const { adminUser, defaultPassword } = await seedUsers(prisma);

  // 3. Ringkasan Hasil Seeding
  console.log('\n✨ Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Categories: ${await prisma.category.count()}`);
  console.log(`   - Destinations: ${await prisma.destination.count()}`);
  console.log(`   - Ticket Types: ${await prisma.ticketType.count()}\n`);

  console.log('🔑 Default Users:');
  console.log(`   Admin: ${adminUser.email} / ${defaultPassword}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });