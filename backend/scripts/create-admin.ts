/**
 * Script to create an admin user in the database
 * Usage: npx ts-node scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'admin@photography.com',
        userType: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: admin@photography.com`);
      console.log(`   Password: admin123`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@photography.com',
        passwordHash,
        userType: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        isVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log('');
    console.log('You can now login to the admin dashboard with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
