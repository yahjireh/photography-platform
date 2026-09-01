import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmins() {
  const admins = await prisma.users.findMany({
    where: { user_type: 'ADMIN' },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      user_type: true,
      is_active: true,
      is_verified: true
    }
  });

  console.log('📋 Admin users in database:');
  console.log(JSON.stringify(admins, null, 2));

  await prisma.$disconnect();
}

checkAdmins();
