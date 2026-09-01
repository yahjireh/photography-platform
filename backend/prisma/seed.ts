/**
 * Prisma Seed Script
 * Creates an admin user for accessing admin routes
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.users.findFirst({
    where: { user_type: 'ADMIN' }
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', existingAdmin.email);
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123456', 10);

  const admin = await prisma.users.create({
    data: {
      email: 'admin@photography.com',
      password_hash: hashedPassword,
      user_type: 'ADMIN',
      first_name: 'Admin',
      last_name: 'User',
      phone_number: '+1234567890',
      is_verified: true,
      is_active: true,
      location_city: 'Lagos',
      location_country: 'Nigeria'
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email:', admin.email);
  console.log('🔑 Password: admin123456');
  console.log('⚠️  Please change this password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
