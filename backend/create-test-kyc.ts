/**
 * Script to create test KYC data for existing photographers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestKYC() {
  try {
    // Get all photographers without KYC records
    const photographers = await prisma.photographers.findMany({
      where: {
        photographer_kyc: null
      },
      include: {
        users: true
      },
      take: 5 // Create KYC for first 5 photographers
    });

    console.log(`Found ${photographers.length} photographers without KYC records`);

    for (const photographer of photographers) {
      const user = photographer.users;

      await prisma.photographer_kyc.create({
        data: {
          photographer_id: photographer.id,
          user_id: user.id,
          kyc_status: 'SUBMITTED',
          submitted_at: new Date(),

          // Identity
          legal_name: `${user.first_name} ${user.last_name}`,
          date_of_birth: new Date('1990-01-01'),
          nationality: 'Ghana',
          id_type: 'GHANA_CARD',
          id_number: `GHA-${Math.random().toString().slice(2, 11)}-0`,

          // Contact
          email: user.email,
          email_verified: !!user.email_verified_at,
          phone: user.phone_number || '+233244123456',
          phone_verified: false,
          city: user.location_city || 'Accra',
          region: 'Greater Accra',
          service_area: 'Accra Metropolitan Area',

          // Portfolio
          categories: ['WEDDING', 'PORTRAIT'],
          years_experience: 'TWO_FOUR',
          portfolio_link: photographer.portfolio_website,

          // Payment
          payout_method: 'MOMO',
          account_holder_name: `${user.first_name} ${user.last_name}`,
          momo_network: 'MTN',
          momo_number: user.phone_number || '0244123456',
          payout_name_match: 'EXACT_MATCH',
        }
      });

      console.log(`✅ Created KYC for ${user.first_name} ${user.last_name} (${photographer.id})`);
    }

    console.log('\n✅ Test KYC data created successfully!');
  } catch (error) {
    console.error('❌ Error creating test KYC:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestKYC();
