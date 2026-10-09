import prisma from '../src/config/database';

async function main() {
  console.log('Running safe database sync for Ghana tax and compliance updates...');

  try {
    // 1. Enum
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaxFilingStatus') THEN
          CREATE TYPE "TaxFilingStatus" AS ENUM ('UNFILED', 'PROCESSING', 'FILED', 'OVERDUE');
        END IF;
      END $$;
    `);
    console.log('✅ TaxFilingStatus enum ensured');

    // 2. Add columns to photographer_kyc
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "photographer_kyc" 
        ADD COLUMN IF NOT EXISTS "ghana_card_number" TEXT,
        ADD COLUMN IF NOT EXISTS "selfie_url" TEXT,
        ADD COLUMN IF NOT EXISTS "agreed_to_artisan_tax" BOOLEAN DEFAULT TRUE;
    `);
    console.log('✅ photographer_kyc columns ensured');

    // 3. Add columns to payments
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "payments" 
        ADD COLUMN IF NOT EXISTS "gross_amount_charged" NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS "base_shoot_rate" NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS "consumer_tax_reserve" NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS "withheld_service_tax" NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS "platform_commission" NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS "net_creator_payout" NUMERIC(10, 2);
    `);
    console.log('✅ payments columns ensured');

    // 4. Create gra_tax_remittance_ledger
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "gra_tax_remittance_ledger" (
        "id" TEXT PRIMARY KEY,
        "taxPeriodMonth" INTEGER NOT NULL,
        "taxPeriodYear" INTEGER NOT NULL,
        "totalConsumerVat" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "totalConsumerNhil" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "totalConsumerGetfund" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "totalWithheldArtisanTax" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "totalDueToGRA" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        "status" "TaxFilingStatus" NOT NULL DEFAULT 'UNFILED',
        "graReceiptNumber" TEXT,
        "filedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "gra_tax_remittance_ledger_month_year_unique" UNIQUE ("taxPeriodMonth", "taxPeriodYear")
      );
    `);
    console.log('✅ gra_tax_remittance_ledger table ensured');

    // 5. Create transaction_tax_breakdowns
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "transaction_tax_breakdowns" (
        "id" TEXT PRIMARY KEY,
        "payment_id" TEXT NOT NULL UNIQUE REFERENCES "payments"("id") ON DELETE CASCADE,
        "base_shoot_rate" NUMERIC(10, 2) NOT NULL,
        "vat_component" NUMERIC(10, 2) NOT NULL,
        "nhil_component" NUMERIC(10, 2) NOT NULL,
        "getfund_component" NUMERIC(10, 2) NOT NULL,
        "withheld_wht_component" NUMERIC(10, 2) NOT NULL,
        "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ transaction_tax_breakdowns table ensured');

    console.log('🎉 Safe DB sync completed successfully without touching any existing data!');
  } catch (error) {
    console.error('❌ Error executing DB sync:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
