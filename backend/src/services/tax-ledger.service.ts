/**
 * Tax Ledger Service
 * Handles Ghanaian tax aggregation, remittance ledger compilation, and GRA compliance reporting.
 * 
 * Complies with Ghana Revenue Authority (GRA) guidelines:
 * - 15% Standard Value Added Tax (VAT)
 * - 2.5% National Health Insurance Levy (NHIL)
 * - 2.5% Ghana Education Trust Fund (GETFund)
 * - 7.5% Resident Service Withholding Tax (WHT)
 */

import prisma from '../config/database';
import { TaxFilingStatus } from '@prisma/client';

export class TaxLedgerService {
  /**
   * Compiles and locks the platform data for the monthly GRA remittance filing.
   * Runs at midnight on the last day of each calendar month or on-demand.
   * 
   * @param month Month number (1-12)
   * @param year Year (e.g., 2026)
   */
  public async compileMonthlyTaxLedger(month: number, year: number) {
    // 1. Calculate the target date window
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 2. Aggregate all tax breakdowns tied to completed payments within the month window
    const aggregations = await prisma.transactionTaxBreakdown.aggregate({
      where: {
        processedAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        vatComponent: true,
        nhilComponent: true,
        getfundComponent: true,
        withheldWhtComponent: true
      }
    });

    const vat = aggregations._sum.vatComponent?.toNumber() || 0;
    const nhil = aggregations._sum.nhilComponent?.toNumber() || 0;
    const getfund = aggregations._sum.getfundComponent?.toNumber() || 0;
    const wht = aggregations._sum.withheldWhtComponent?.toNumber() || 0;
    const totalLiability = Number((vat + nhil + getfund + wht).toFixed(2));

    // 3. Upsert into your tracking ledger table
    return await prisma.graTaxRemittanceLedger.upsert({
      where: {
        taxPeriodMonth_taxPeriodYear: { taxPeriodMonth: month, taxPeriodYear: year }
      },
      update: {
        totalConsumerVat: vat,
        totalConsumerNhil: nhil,
        totalConsumerGetfund: getfund,
        totalWithheldArtisanTax: wht,
        totalDueToGRA: totalLiability,
        updatedAt: new Date()
      },
      create: {
        taxPeriodMonth: month,
        taxPeriodYear: year,
        totalConsumerVat: vat,
        totalConsumerNhil: nhil,
        totalConsumerGetfund: getfund,
        totalWithheldArtisanTax: wht,
        totalDueToGRA: totalLiability,
        status: TaxFilingStatus.UNFILED
      }
    });
  }

  /**
   * Records transactional tax breakdown for an individual payment.
   */
  public async recordTransactionTaxBreakdown(data: {
    paymentId: string;
    baseShootRate: number;
    vatComponent: number;
    nhilComponent: number;
    getfundComponent: number;
    withheldWhtComponent: number;
    processedAt?: Date;
  }) {
    return await prisma.transactionTaxBreakdown.upsert({
      where: { paymentId: data.paymentId },
      update: {
        baseShootRate: data.baseShootRate,
        vatComponent: data.vatComponent,
        nhilComponent: data.nhilComponent,
        getfundComponent: data.getfundComponent,
        withheldWhtComponent: data.withheldWhtComponent,
        processedAt: data.processedAt || new Date()
      },
      create: {
        paymentId: data.paymentId,
        baseShootRate: data.baseShootRate,
        vatComponent: data.vatComponent,
        nhilComponent: data.nhilComponent,
        getfundComponent: data.getfundComponent,
        withheldWhtComponent: data.withheldWhtComponent,
        processedAt: data.processedAt || new Date()
      }
    });
  }

  /**
   * Retrieves ledger status for a given month and year.
   */
  public async getTaxLedgerByPeriod(month: number, year: number) {
    return await prisma.graTaxRemittanceLedger.findUnique({
      where: {
        taxPeriodMonth_taxPeriodYear: { taxPeriodMonth: month, taxPeriodYear: year }
      }
    });
  }

  /**
   * Retrieves all tax remittance ledgers, optionally filtered by year.
   */
  public async getAllTaxLedgers(year?: number) {
    return await prisma.graTaxRemittanceLedger.findMany({
      where: year ? { taxPeriodYear: year } : undefined,
      orderBy: [
        { taxPeriodYear: 'desc' },
        { taxPeriodMonth: 'desc' }
      ]
    });
  }

  /**
   * Marks a monthly remittance ledger as filed with GRA taxpayer receipt reference.
   */
  public async recordGraFiling(month: number, year: number, graReceiptNumber: string) {
    return await prisma.graTaxRemittanceLedger.update({
      where: {
        taxPeriodMonth_taxPeriodYear: { taxPeriodMonth: month, taxPeriodYear: year }
      },
      data: {
        status: TaxFilingStatus.FILED,
        graReceiptNumber,
        filedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Automated cron aggregator runner.
   * Runs periodic checks to seal the prior month and refresh the current month ledger.
   */
  public startAutomatedCronAggregation(intervalMs: number = 1000 * 60 * 60 * 12) { // Default every 12 hours
    console.log('⏰ Initializing Automated GRA Tax Ledger Aggregation cron...');

    const runAggregation = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 1. Compile current ongoing month
        await this.compileMonthlyTaxLedger(currentMonth, currentYear);

        // 2. Also compile previous month to capture any delayed month-end transactions
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        await this.compileMonthlyTaxLedger(previousMonth, previousYear);

        console.log(`📊 [GRA Tax Ledger] Compiled ledgers for ${previousMonth}/${previousYear} and ${currentMonth}/${currentYear}`);
      } catch (err: any) {
        console.error('❌ [GRA Tax Ledger] Automated aggregation failed:', err?.message || err);
      }
    };

    // Execute immediately on startup
    runAggregation();

    // Schedule periodic execution
    const intervalTimer = setInterval(runAggregation, intervalMs);
    return intervalTimer;
  }
}

export const taxLedgerService = new TaxLedgerService();
export default taxLedgerService;
