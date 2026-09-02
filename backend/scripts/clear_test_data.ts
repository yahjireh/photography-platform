import prisma from '../src/config/database';

async function clearTestData() {
  console.log('🧹 Starting safe test data cleanup (preserving ADMIN accounts)...');

  try {
    // 1. Delete dependent transactional records
    const delReviews = await prisma.reviews.deleteMany({});
    console.log(`✅ Deleted ${delReviews.count} test reviews`);

    const delPayments = await prisma.payments.deleteMany({});
    console.log(`✅ Deleted ${delPayments.count} test payments`);

    const delBookingPhotos = await prisma.booking_photos.deleteMany({});
    console.log(`✅ Deleted ${delBookingPhotos.count} test booking photos`);

    const delDisputes = await prisma.disputes.deleteMany({});
    console.log(`✅ Deleted ${delDisputes.count} test disputes`);

    const delMessages = await prisma.messages.deleteMany({});
    console.log(`✅ Deleted ${delMessages.count} test messages`);

    const delBookings = await prisma.bookings.deleteMany({});
    console.log(`✅ Deleted ${delBookings.count} test bookings`);

    // 2. Delete photographer profiles & KYC
    const delKycDocs = await prisma.photographer_kyc_documents.deleteMany({});
    console.log(`✅ Deleted ${delKycDocs.count} test KYC documents`);

    const delKycAudit = await prisma.photographer_kyc_audit.deleteMany({});
    console.log(`✅ Deleted ${delKycAudit.count} test KYC audits`);

    const delKyc = await prisma.photographer_kyc.deleteMany({});
    console.log(`✅ Deleted ${delKyc.count} test KYC records`);

    const delPortfolio = await prisma.portfolio_items.deleteMany({});
    console.log(`✅ Deleted ${delPortfolio.count} test portfolio items`);

    const delAvailability = await prisma.availability.deleteMany({});
    console.log(`✅ Deleted ${delAvailability.count} test availability records`);

    const delPackages = await prisma.packages.deleteMany({});
    console.log(`✅ Deleted ${delPackages.count} test packages`);

    const delSubaccounts = await prisma.paystack_subaccounts.deleteMany({});
    console.log(`✅ Deleted ${delSubaccounts.count} test Paystack subaccounts`);

    const delSubscriptions = await prisma.subscriptions.deleteMany({});
    console.log(`✅ Deleted ${delSubscriptions.count} test subscriptions`);

    const delPhotographers = await prisma.photographers.deleteMany({});
    console.log(`✅ Deleted ${delPhotographers.count} test photographers`);

    // 3. Delete non-admin notifications
    const delNotifications = await prisma.notifications.deleteMany({
      where: {
        users: {
          user_type: { not: 'ADMIN' }
        }
      }
    });
    console.log(`✅ Deleted ${delNotifications.count} non-admin notifications`);

    // 4. Delete non-admin users
    const delUsers = await prisma.users.deleteMany({
      where: {
        user_type: { not: 'ADMIN' }
      }
    });
    console.log(`✅ Deleted ${delUsers.count} test non-admin users`);

    // 5. Verify remaining ADMIN accounts
    const remainingAdmins = await prisma.users.findMany({
      where: { user_type: 'ADMIN' },
      select: { id: true, email: true, first_name: true, last_name: true, user_type: true }
    });

    console.log('\n🎉 Cleanup completed successfully! Preserved Admin Users:');
    console.table(remainingAdmins);
  } catch (err: any) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
