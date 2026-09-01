# KYC Verification Database Schema

## Enums

```sql
-- KYC Status
CREATE TYPE kyc_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_MORE_INFO',
  'SUSPENDED'
);

-- ID Type (Ghana context)
CREATE TYPE id_type AS ENUM (
  'GHANA_CARD',
  'PASSPORT',
  'DRIVERS_LICENSE'
);

-- Check Result
CREATE TYPE check_result AS ENUM (
  'PASS',
  'FAIL',
  'UNCLEAR'
);

-- Payout Method
CREATE TYPE payout_method AS ENUM (
  'BANK',
  'MOMO'
);

-- Mobile Money Network (Ghana)
CREATE TYPE momo_network AS ENUM (
  'MTN',
  'VODAFONE',
  'AIRTELTIGO'
);

-- Name Match Level
CREATE TYPE name_match AS ENUM (
  'EXACT_MATCH',
  'PARTIAL_MATCH',
  'NO_MATCH',
  'NOT_CHECKED'
);

-- Portfolio Quality
CREATE TYPE portfolio_quality AS ENUM (
  'GOOD',
  'BORDERLINE',
  'POOR'
);

-- Originality Flag
CREATE TYPE originality_flag AS ENUM (
  'ORIGINAL',
  'SUSPECTED_STOLEN',
  'UNCLEAR'
);

-- Years Experience
CREATE TYPE years_experience AS ENUM (
  '0_1',
  '2_4',
  '5_9',
  '10_PLUS'
);

-- Photography Categories
CREATE TYPE photo_category AS ENUM (
  'WEDDING',
  'PORTRAIT',
  'EVENTS',
  'FASHION',
  'PRODUCT',
  'REAL_ESTATE',
  'DOCUMENTARY',
  'OTHER'
);

-- Reason Codes
CREATE TYPE reason_code AS ENUM (
  'ID_NOT_CLEAR',
  'ID_EXPIRED',
  'NAME_MISMATCH',
  'DUPLICATE_ID',
  'DUPLICATE_PAYOUT_DETAILS',
  'PORTFOLIO_INSUFFICIENT',
  'PORTFOLIO_SUSPECTED_STOLEN',
  'PAYMENT_DETAILS_INCOMPLETE',
  'PAYMENT_NAME_MISMATCH',
  'POLICY_VIOLATION',
  'OTHER'
);

-- Request Info Items
CREATE TYPE request_info_item AS ENUM (
  'ID_NOT_CLEAR',
  'ID_EXPIRED',
  'SELFIE_MISSING',
  'PORTFOLIO_TOO_SMALL',
  'PORTFOLIO_UNCLEAR',
  'PAYMENT_NAME_MISMATCH',
  'PAYMENT_DETAILS_INCOMPLETE',
  'OTHER'
);
```

## Table 1: photographer_kyc

```sql
CREATE TABLE photographer_kyc (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL UNIQUE, -- FK to photographers table
  user_id UUID NOT NULL, -- FK to users table

  -- Status & Timestamps
  kyc_status kyc_status NOT NULL DEFAULT 'DRAFT',
  submitted_at TIMESTAMP,
  last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,

  -- A. Identity Section
  legal_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality VARCHAR(100) DEFAULT 'Ghana',
  id_type id_type NOT NULL,
  id_number VARCHAR(100) NOT NULL,

  -- Identity Review
  identity_check_result check_result,
  identity_fail_reason_code reason_code,
  identity_notes TEXT,

  -- C. Contact & Location
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(50) NOT NULL,
  phone_verified BOOLEAN DEFAULT false,
  city VARCHAR(100),
  region VARCHAR(100),
  service_area TEXT,

  -- Contact Review
  contact_check_result check_result,
  contact_notes TEXT,

  -- D. Portfolio Verification
  categories photo_category[] NOT NULL DEFAULT '{}',
  years_experience years_experience,
  portfolio_link VARCHAR(500),

  -- Portfolio Review
  portfolio_check_result check_result,
  portfolio_quality portfolio_quality,
  originality_flag originality_flag,
  portfolio_notes TEXT,

  -- E. Payment Verification
  payout_method payout_method NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  momo_network momo_network,
  momo_number VARCHAR(50),

  -- Payout Review
  payout_name_match name_match DEFAULT 'NOT_CHECKED',
  payout_check_result check_result,
  payout_notes TEXT,

  -- F. Platform Access Controls
  is_search_visible BOOLEAN DEFAULT false,
  can_accept_bookings BOOLEAN DEFAULT false,
  can_receive_payouts BOOLEAN DEFAULT false,
  kyc_verified_badge BOOLEAN DEFAULT false,

  -- Decision Info
  decision_reason_code reason_code,
  decision_notes TEXT,
  request_info_items request_info_item[] DEFAULT '{}',
  reviewed_by UUID, -- FK to admin users
  reviewed_at TIMESTAMP,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_payout_bank CHECK (
    (payout_method = 'BANK' AND bank_name IS NOT NULL AND bank_account_number IS NOT NULL)
    OR payout_method != 'BANK'
  ),
  CONSTRAINT check_payout_momo CHECK (
    (payout_method = 'MOMO' AND momo_network IS NOT NULL AND momo_number IS NOT NULL)
    OR payout_method != 'MOMO'
  )
);

-- Indexes
CREATE UNIQUE INDEX idx_photographer_kyc_photographer_id ON photographer_kyc(photographer_id);
CREATE INDEX idx_photographer_kyc_user_id ON photographer_kyc(user_id);
CREATE INDEX idx_photographer_kyc_status ON photographer_kyc(kyc_status);
CREATE INDEX idx_photographer_kyc_submitted_at ON photographer_kyc(submitted_at);
```

## Table 2: photographer_kyc_documents

```sql
CREATE TABLE photographer_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL, -- FK to photographers
  kyc_id UUID NOT NULL, -- FK to photographer_kyc

  -- Document Info
  document_type VARCHAR(50) NOT NULL, -- 'id_front', 'id_back', 'selfie', 'portfolio_1', 'portfolio_2', etc.
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(100),

  -- Review
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID, -- FK to admin users
  verified_at TIMESTAMP,
  rejection_reason TEXT,

  -- Audit
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT fk_kyc FOREIGN KEY (kyc_id) REFERENCES photographer_kyc(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_kyc_docs_photographer_id ON photographer_kyc_documents(photographer_id);
CREATE INDEX idx_kyc_docs_kyc_id ON photographer_kyc_documents(kyc_id);
CREATE INDEX idx_kyc_docs_type ON photographer_kyc_documents(document_type);
```

## Table 3: photographer_kyc_audit

```sql
CREATE TABLE photographer_kyc_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL,
  kyc_id UUID NOT NULL,

  -- Event Info
  event_type VARCHAR(100) NOT NULL, -- 'status_change', 'toggle_change', 'document_reviewed', 'notes_added', etc.
  field_name VARCHAR(100), -- e.g., 'kyc_status', 'is_search_visible', 'identity_check_result'
  old_value TEXT,
  new_value TEXT,

  -- Admin Action
  admin_user_id UUID NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  action_notes TEXT,

  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_kyc_audit FOREIGN KEY (kyc_id) REFERENCES photographer_kyc(id) ON DELETE CASCADE
);

-- Indexes (append-only, optimized for reads)
CREATE INDEX idx_kyc_audit_photographer_id ON photographer_kyc_audit(photographer_id);
CREATE INDEX idx_kyc_audit_kyc_id ON photographer_kyc_audit(kyc_id);
CREATE INDEX idx_kyc_audit_created_at ON photographer_kyc_audit(created_at DESC);
CREATE INDEX idx_kyc_audit_admin ON photographer_kyc_audit(admin_user_id);
```

## Example API Responses

### Get KYC by Photographer ID

```json
{
  "success": true,
  "data": {
    "kyc": {
      "id": "kyc-uuid-123",
      "photographer_id": "photographer-uuid-456",
      "user_id": "user-uuid-789",
      "kyc_status": "IN_REVIEW",
      "submitted_at": "2026-02-01T10:00:00Z",
      "last_updated_at": "2026-02-05T15:30:00Z",

      "identity": {
        "legal_name": "John Kwame Mensah",
        "date_of_birth": "1990-05-15",
        "age": 35,
        "nationality": "Ghana",
        "id_type": "GHANA_CARD",
        "id_number": "GHA-123456789-0",
        "identity_check_result": "PASS",
        "identity_notes": "ID verified successfully"
      },

      "contact": {
        "email": "john@example.com",
        "email_verified": true,
        "phone": "+233244123456",
        "phone_verified": true,
        "city": "Accra",
        "region": "Greater Accra",
        "service_area": "Accra, Tema, Kasoa",
        "contact_check_result": "PASS"
      },

      "portfolio": {
        "categories": ["WEDDING", "PORTRAIT", "EVENTS"],
        "years_experience": "5_9",
        "portfolio_link": "https://johnphotography.com",
        "portfolio_check_result": "PASS",
        "portfolio_quality": "GOOD",
        "originality_flag": "ORIGINAL"
      },

      "payment": {
        "payout_method": "MOMO",
        "account_holder_name": "John Kwame Mensah",
        "momo_network": "MTN",
        "momo_number": "0244123456",
        "payout_name_match": "EXACT_MATCH",
        "payout_check_result": "PASS"
      },

      "access_controls": {
        "is_search_visible": false,
        "can_accept_bookings": false,
        "can_receive_payouts": false,
        "kyc_verified_badge": false
      },

      "documents": [
        {
          "id": "doc-uuid-1",
          "document_type": "id_front",
          "file_url": "https://storage/id_front.jpg",
          "is_verified": true,
          "verified_at": "2026-02-05T14:00:00Z"
        },
        {
          "id": "doc-uuid-2",
          "document_type": "id_back",
          "file_url": "https://storage/id_back.jpg",
          "is_verified": true
        },
        {
          "id": "doc-uuid-3",
          "document_type": "portfolio_1",
          "file_url": "https://storage/portfolio_1.jpg",
          "is_verified": true
        }
      ]
    },

    "photographer": {
      "id": "photographer-uuid-456",
      "display_name": "John Photography",
      "business_name": "John Kwame Photography Studio"
    },

    "audit_timeline": [
      {
        "id": "audit-1",
        "event_type": "status_change",
        "field_name": "kyc_status",
        "old_value": "SUBMITTED",
        "new_value": "IN_REVIEW",
        "admin_name": "Admin User",
        "created_at": "2026-02-05T15:30:00Z"
      },
      {
        "id": "audit-2",
        "event_type": "document_reviewed",
        "field_name": "identity_check_result",
        "new_value": "PASS",
        "admin_name": "Admin User",
        "action_notes": "ID verified successfully",
        "created_at": "2026-02-05T14:00:00Z"
      }
    ]
  }
}
```

### Approve KYC Payload

```json
{
  "action": "approve",
  "decision_reason_code": null,
  "decision_notes": "All checks passed. Photographer is verified.",
  "access_controls": {
    "is_search_visible": true,
    "can_accept_bookings": true,
    "can_receive_payouts": true,
    "kyc_verified_badge": true
  }
}
```

### Request More Info Payload

```json
{
  "action": "request_more_info",
  "decision_reason_code": "PORTFOLIO_INSUFFICIENT",
  "decision_notes": "Please upload at least 5 high-quality portfolio images showing your best work.",
  "request_info_items": [
    "PORTFOLIO_TOO_SMALL",
    "PORTFOLIO_UNCLEAR"
  ]
}
```

### Reject KYC Payload

```json
{
  "action": "reject",
  "decision_reason_code": "PORTFOLIO_SUSPECTED_STOLEN",
  "decision_notes": "Portfolio images appear to be taken from another photographer's website. Reverse image search found matches.",
  "access_controls": {
    "is_search_visible": false,
    "can_accept_bookings": false,
    "can_receive_payouts": false,
    "kyc_verified_badge": false
  }
}
```

## Business Rules Implementation

```typescript
// Rule 1: Search Visibility
function canAppearInSearch(kyc: PhotographerKYC): boolean {
  return kyc.kyc_status === 'APPROVED' && kyc.is_search_visible === true;
}

// Rule 2: Accept Bookings
function canAcceptBookings(kyc: PhotographerKYC): boolean {
  return kyc.kyc_status === 'APPROVED' && kyc.can_accept_bookings === true;
}

// Rule 3: Receive Payouts
function canReceivePayouts(kyc: PhotographerKYC): boolean {
  return (
    kyc.kyc_status === 'APPROVED' &&
    kyc.can_receive_payouts === true &&
    kyc.payout_check_result === 'PASS'
  );
}

// Rule 4: Status Change Effects
function handleStatusChange(newStatus: KYCStatus): Partial<PhotographerKYC> {
  switch (newStatus) {
    case 'REJECTED':
    case 'SUSPENDED':
      return {
        is_search_visible: false,
        can_accept_bookings: false,
        can_receive_payouts: false,
        kyc_verified_badge: false
      };

    case 'NEEDS_MORE_INFO':
      // Keep existing access controls, don't revoke
      return {};

    case 'APPROVED':
      // Admin must explicitly set access controls
      return {};

    default:
      return {};
  }
}
```
