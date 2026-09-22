# ClickFlicks Production Infrastructure Budget & Service Guide

**Document Version:** 1.0.0  
**Application:** ClickFlicks (Client App, Photographer Studio App, Admin Dashboard, Backend API)  
**Target Market:** Ghana / Global  
**Pricing Currency:** USD ($) & Ghanaian Cedi (GHS)  
**Phase:** Initial Production Launch (Optimized for High Reliability & Zero Downtime)

---

## Executive Summary

This document provides the complete, itemized cost analysis for launching and operating the ClickFlicks ecosystem without downtime or cold-start freezes. 

The architecture is designed to keep monthly fixed overhead minimal while ensuring:
1. **Zero Sleeping Servers:** Eliminates the 50-second cold-start delay typical of free-tier backends.
2. **Infinite Asset Egress:** Prevents massive bandwidth bills when clients and photographers browse high-resolution image galleries.
3. **Local Reliability:** Seamless Ghana Mobile Money integration via Paystack and local SMS OTPs via Arkesel.

---

## Master Cost Matrix

| Service | Category | Selected Entry Tier | Unit Cost | Billing Cycle | Downtime Prevention Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Render** | Backend API Server | **Starter Web Service** | **$7.00** | Monthly | Keeps Express API online 24/7 (prevents 15-min idle spin-down). |
| **Supabase** | PostgreSQL Database | **Free Tier** *(or Pro)* | **$0.00** *(Pro: $25)* | Monthly | 500 MB DB & 50k MAU. Kept awake by active backend traffic. |
| **Vercel** | Web & Admin Hosting | **Hobby (Free)** | **$0.00** | Monthly | Edge CDN hosting for Client, Photographer, and Admin web apps. |
| **Cloudflare** | DNS, CDN & Security | **Free Plan** | **$0.00** | Monthly | Global edge caching, DDoS protection, and automated SSL. |
| **Cloudflare R2** | Image Object Storage | **Free Allowance** | **$0.00** *(10 GB incl.)* | Monthly | $0 egress bandwidth fees for portfolio photos & KYC documents. |
| **Resend** | Transactional Email | **Free Tier** | **$0.00** *(3k msgs/mo)* | Monthly | Instant delivery for receipts, booking notices, and security codes. |
| **Arkesel** | SMS & OTP Verification | **Pay-As-You-Go** | **~GHS 50** (~$3.50) | Usage (Deposit) | Delivery of mobile phone OTPs (~GHS 0.035/SMS) and booking alerts. |
| **Paystack** | Payment Processing | **Standard Merchant** | **$0.00 setup** | 1.95% / tx | Escrow payment collection (Cards & MoMo) and automated payouts. |
| **Domain Name** | Custom Domain | **.com / .com.gh** | **~$10.44 – $14.00** | Annual | Branded domain (`clickflicks.com` or `clickflicksgh.com`). |
| **Official Email** | Business Inbox | **Zoho Mail Lite** | **$1.00 / user** | Monthly | Dedicated `support@clickflicks.com` inbox with IMAP/SMTP/Mobile. |
| **Google Play** | Android Distribution | **Play Console Account** | **$25.00** | One-time | Lifetime publishing license for Photographer & Client Android apps. |
| **Apple App Store** | iOS Distribution | **Developer Program** | **$99.00** | Annual | Publishing license for iOS App Store and TestFlight distribution. |

---

## Detailed Service Analysis

### 1. Backend API: Render
*   **Website:** [render.com](https://render.com/pricing)
*   **Recommended Plan:** **Starter Instance**
*   **Cost:** **$7.00 / month** (billed per second)
*   **Specifications:** 0.5 vCPU, 512 MB RAM, persistent connections.
*   **Why Not the Free Tier?**
    *   Render's free tier spins down (sleeps) after 15 minutes of inactivity. When a user opens the mobile app after an idle period, their initial request experiences a **50 to 75-second cold start delay**, frequently causing mobile network timeouts and failed logins. The $7/mo Starter plan guarantees 100% uptime with zero sleep cycles.

---

### 2. Database: Supabase
*   **Website:** [supabase.com](https://supabase.com/pricing)
*   **Recommended Plan:** **Free Tier** at launch (Upgrade to **Pro ($25/mo)** when active user volume scales)
*   **Cost:** **$0.00 / month**
*   **Included Limits:**
    *   Dedicated PostgreSQL database
    *   500 MB database storage (~250,000 text records/bookings)
    *   50,000 monthly active users (MAU)
    *   5 GB bandwidth egress
*   **Downtime Management:** Free Supabase projects pause after **7 days of total inactivity**. Because your Render backend connects to the database upon startup and handles continuous user traffic (or periodic health checks), your database will remain continuously active without pausing. If you want 7-day automated point-in-time recovery and zero risk of pausing, upgrade to **Pro ($25/mo)**.

---

### 3. Frontend & Admin Hosting: Vercel
*   **Website:** [vercel.com](https://vercel.com/pricing)
*   **Recommended Plan:** **Hobby (Free)**
*   **Cost:** **$0.00 / month**
*   **Included Limits:**
    *   Global Anycast Edge CDN
    *   100 GB monthly bandwidth
    *   Automatic SSL certificate generation and renewals
    *   Continuous integration from Git (`origin main` auto-deploy)
*   **Uptime Guarantee:** Vercel static and client-side single page apps (SPA) serve from edge points-of-presence globally with zero cold starts and 99.99% uptime.

---

### 4. CDN, DNS, and Object Storage: Cloudflare & Cloudflare R2
*   **Website:** [cloudflare.com](https://www.cloudflare.com/plans/)
*   **Recommended Plan:** **Free Tier + R2 Storage**
*   **Cost:** **$0.00 / month**
*   **Storage Specs (R2):**
    *   **First 10 GB storage:** Free every month.
    *   **Bandwidth Egress:** **$0.00 (Unlimited Free Egress)**.
    *   **Class A Operations (Uploads):** 1,000,000 free / month.
    *   **Class B Operations (Downloads/Views):** 10,000,000 free / month.
    *   *Storage over 10 GB is billed at just $0.015 per GB-month.*
*   **Why R2 Over AWS S3?** AWS charges ~$0.09 per GB of downloaded images. For a photography platform with high-resolution galleries, AWS egress fees quickly become expensive. Cloudflare R2 has **zero egress charges**.

---

### 5. Transactional Email: Resend
*   **Website:** [resend.com](https://resend.com/pricing)
*   **Recommended Plan:** **Free Tier**
*   **Cost:** **$0.00 / month**
*   **Included Limits:**
    *   3,000 emails per month
    *   100 emails per day limit
    *   Custom domain authentication (DKIM, SPF, DMARC)
*   **Use Cases:** Booking confirmations, payment receipts, KYC decision alerts, and password resets. When daily email volume exceeds 100 emails, upgrade to the **Pro plan ($20/mo)** for 50,000 emails/month.

---

### 6. Ghana SMS & OTP Verification: Arkesel
*   **Website:** [arkesel.com](https://arkesel.com/bulk-sms)
*   **Recommended Plan:** **Pay-As-You-Go Wallet Credit**
*   **Cost:** **GHS 30.00 – GHS 50.00** (~$2.00 – $3.50 initial top-up)
*   **Per-Message Unit Rates:**
    *   Phone OTP verification: **GHS 0.035** (~3.5 pesewas) per SMS
    *   Standard notification SMS: **GHS 0.028 – 0.031** per SMS
*   **Billing Nature:** Pre-funded wallet with no monthly recurring maintenance fees. A GHS 50 top-up will cover approximately **1,400 to 1,700 verification messages**.

---

### 7. Payment Gateway & Escrow: Paystack Ghana
*   **Website:** [paystack.com](https://paystack.com/gh/pricing)
*   **Recommended Plan:** **Standard Live Merchant Account**
*   **Upfront Cost:** **$0.00**
*   **Monthly Maintenance:** **$0.00**
*   **Per-Transaction Fees:**
    *   Local Ghana Transactions (MTN, Telecel, AirtelTigo, Cards): **1.95%** per transaction
    *   Payout to Mobile Money Wallet: **GHS 1.00** flat per payout
    *   Payout to Bank Account: **GHS 8.00** flat per payout
*   **Note:** Processing fees are deducted automatically from gross incoming bookings; no upfront balance is needed.

---

### 8. Domain Name Registration
*   **Recommended Registrars:** Cloudflare Registrar, Namecheap, or local GH registrar.
*   **Cost:**
    *   `.com` (e.g. `clickflicks.com` or `clickflicksgh.com`): **~$10.44 – $13.99 / year**
    *   `.app` (e.g. `clickflicks.app`): **~$14.00 – $18.00 / year**
    *   `.com.gh`: **~GHS 150.00 – GHS 250.00 / year**
*   **Recommendation:** Purchase through Cloudflare Registrar for wholesale pricing (~$10.44/year) with free permanent WHOIS domain privacy.

---

### 9. Official Business Email
*   **Option 1: Zoho Mail Lite (Recommended - High Value)**
    *   **Cost:** **$1.00 / user / month** (or **$12.00 / year**)
    *   **Features:** Custom address (`support@clickflicks.com`), 5 GB storage, clean webmail, and mobile apps (iOS & Android).
*   **Option 2: Google Workspace (Business Starter)**
    *   **Cost:** **$7.00 / user / month** (annual commitment) or **$8.40 / month** (flexible)
    *   **Features:** Gmail interface, 30 GB Google Drive storage, Google Meet.
*   **Option 3: Cloudflare Email Routing (Free Alternative)**
    *   **Cost:** **$0.00**
    *   **Mechanism:** Inbound emails to `hello@clickflicks.com` automatically forward to your personal Gmail inbox. Outbound messages are delivered via the Resend API.

---

### 10. App Store Publishing Licenses
*   **Google Play Store (Google Play Console):**
    *   **Cost:** **$25.00 one-time fee** (lifetime access).
    *   **Terms:** Covers publishing both the Client and Photographer apps with unlimited app updates.
*   **Apple App Store (Apple Developer Program):**
    *   **Cost:** **$99.00 / year**.
    *   **Terms:** Required for App Store distribution, TestFlight beta testing, and active iOS cryptographic signing certificates. *(Can be purchased when ready to submit iOS builds).*

---

## Budget Summary by Timeline

### 1. Initial Launch Capital (Day 1 One-Time Expenses)

| Item | Provider | Estimated Amount (USD) | Estimated Amount (GHS) |
| :--- | :--- | :--- | :--- |
| Google Play Developer License | Google | $25.00 | ~GHS 380 |
| Domain Registration (1st Year) | Cloudflare / Namecheap | $12.00 | ~GHS 180 |
| Arkesel SMS Initial Wallet Top-Up | Arkesel | $3.50 | GHS 50 |
| Paystack Account Activation | Paystack | $0.00 | GHS 0 |
| **Initial Capital Subtotal** | | **$40.50** | **~GHS 610** |

---

### 2. Monthly Operational Expenses (Ongoing)

#### Option A: Lean & Smart (Recommended Initial Operating Budget)

| Service | Plan | Monthly Cost (USD) | Monthly Cost (GHS) |
| :--- | :--- | :--- | :--- |
| **Render API** | Starter Web Service (Always-On) | $7.00 | ~GHS 105 |
| **Supabase DB** | Free Tier (Active Traffic) | $0.00 | GHS 0 |
| **Vercel** | Hobby Free (Client, Studio, Admin) | $0.00 | GHS 0 |
| **Cloudflare & R2** | Free Tier (10 GB incl.) | $0.00 | GHS 0 |
| **Resend** | Free Tier (3,000 emails/mo) | $0.00 | GHS 0 |
| **Zoho Mail** | Mail Lite (1 User: `support@`) | $1.00 | ~GHS 15 |
| **Arkesel SMS** | Pay-as-you-go replenishment | ~$2.00 | ~GHS 30 |
| **Total Monthly Operating Cost** | | **~$10.00 / month** | **~GHS 150 / month** |

---

#### Option B: Fully Managed & Automated (Upgraded Database & Google Suite)

| Service | Plan | Monthly Cost (USD) | Monthly Cost (GHS) |
| :--- | :--- | :--- | :--- |
| **Render API** | Starter Web Service | $7.00 | ~GHS 105 |
| **Supabase DB** | Pro Plan (Daily Backups, No Pausing) | $25.00 | ~GHS 380 |
| **Google Workspace** | Business Starter (1 User) | $7.00 | ~GHS 105 |
| **Arkesel SMS** | Pay-as-you-go replenishment | ~$3.00 | ~GHS 45 |
| **Total Monthly Operating Cost** | | **~$42.00 / month** | **~GHS 635 / month** |

---

### 3. Annual Distribution License

| Item | Frequency | Cost (USD) | Cost (GHS) |
| :--- | :--- | :--- | :--- |
| **Apple Developer Program** | Annual Renewal | $99.00 / year | ~GHS 1,500 / year |

---

## Action Roadmap: Sequence of Accounts to Set Up

1. **Step 1 — Domain & DNS:** Secure the domain (`clickflicks.com` or `clickflicksgh.com`) and route nameservers through Cloudflare.
2. **Step 2 — Official Email:** Create `support@clickflicks.com` on Zoho Mail so all subsequent business registrations (Paystack, Apple, Google) use a professional domain email.
3. **Step 3 — Render Backend:** Create a Render Web Service for `backend`, selecting the **Starter ($7/mo)** plan.
4. **Step 4 — Database:** Create your Supabase project in the closest region (Frankfurt or London for optimal latency to West Africa) and set `DATABASE_URL` in Render.
5. **Step 5 — Vercel Deployments:** Connect GitHub to Vercel and create 3 projects:
   - `clickflicks-client` -> `clickflicks.com` or `app.clickflicks.com`
   - `clickflicks-photographer` -> `studio.clickflicks.com`
   - `photography-admin` -> `admin.clickflicks.com`
6. **Step 6 — SMS & Payments:** Fund your Arkesel account with GHS 50 for OTPs, and submit business documents to Paystack Ghana for live payment activation.
7. **Step 7 — App Publishing:** Pay the $25 Google Play Console fee to begin closed alpha testing, followed by the $99 Apple Developer subscription prior to iOS release.
