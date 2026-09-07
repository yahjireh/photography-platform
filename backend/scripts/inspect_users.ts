import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      phone_number: true,
      is_verified: true,
      email_verified_at: true,
      user_type: true,
      created_at: true
    }
  });
  console.log('=== LATEST USERS IN DATABASE ===');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
