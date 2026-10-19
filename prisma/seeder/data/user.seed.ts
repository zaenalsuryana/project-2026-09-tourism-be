import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const seedUsers = async (prisma: PrismaClient) => {
  console.log('👥 Seeding users...');

  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. User Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@kulidigital.com',
      passwordHash: hashedPassword,
      fullName: 'Admin Kuli Digital',
      phone: '081234567890', // 👈 Wajib & Unik
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. User Regular / Tourist
  const memberUser = await prisma.user.create({
    data: {
      email: 'member@kulidigital.com',
      passwordHash: hashedPassword,
      fullName: 'Member User',
      phone: '081234567891', // 👈 Wajib & Unik
      role: UserRole.TOURIST,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Users seeded');

  return { adminUser, memberUser, defaultPassword };
};