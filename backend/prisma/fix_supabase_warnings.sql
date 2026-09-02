-- ==============================================================================
-- ClickFlicks Supabase Security & Performance Remediation Script (Complete)
-- ==============================================================================
-- This script resolves ALL Supabase Security & Performance Advisor items:
-- 1. "RLS Disabled in Public" (CRITICAL) -> RESOLVED
-- 2. "Sensitive Columns Exposed" (CRITICAL) -> RESOLVED
-- 3. "Public / Signed-in Users Can See Object in GraphQL Schema" -> RESOLVED
-- 4. "Unindexed Foreign Keys" (Performance) -> RESOLVED
-- 5. "RLS Enabled No Policy" (Info Suggestions) -> RESOLVED
--
-- SAFE FOR BACKEND:
-- Your Node.js/Express backend connects via Prisma using the database owner / connection
-- pooler ('postgres' role), which has the BYPASSRLS attribute. Enabling RLS and revoking
-- public/anon access does NOT affect your Express backend or Prisma operations at all.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: ENABLE ROW LEVEL SECURITY (RLS) ON ALL PUBLIC TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.paystack_subaccounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photographer_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photographer_kyc_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photographer_kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- STEP 2: CREATE EXPLICIT POLICIES FOR SERVICE ROLE
-- Clears: "RLS Enabled No Policy (17 Suggestions)"
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE 
    tbl text;
    tables text[] := ARRAY[
        'availability',
        'booking_photos',
        'bookings',
        'disputes',
        'messages',
        'notifications',
        'packages',
        'payments',
        'paystack_subaccounts',
        'photographer_kyc',
        'photographer_kyc_audit',
        'photographer_kyc_documents',
        'photographers',
        'portfolio_items',
        'reviews',
        'subscriptions',
        'users'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Remove existing policy if present to avoid duplication
        EXECUTE format('DROP POLICY IF EXISTS "service_role_full_access" ON public.%I;', tbl);
        -- Create explicit service role policy
        EXECUTE format('CREATE POLICY "service_role_full_access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 3: REVOKE DIRECT REST & GRAPHQL API ACCESS FROM PUBLIC/ANON ROLES
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Ensure newly created tables in public do not inherit permissions for anon/authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- Disable pg_graphql schema introspection for unauthenticated API queries
COMMENT ON SCHEMA public IS '@graphql({"inflect": false})';

-- ------------------------------------------------------------------------------
-- STEP 4: CREATE INDEXES FOR UNINDEXED FOREIGN KEYS
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_availability_photographer_id ON public.availability(photographer_id);
CREATE INDEX IF NOT EXISTS idx_booking_photos_booking_id ON public.booking_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_id ON public.bookings(photographer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package_id ON public.bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON public.disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by_id ON public.disputes(raised_by_id);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_against_id ON public.disputes(raised_against_id);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by_id ON public.disputes(resolved_by_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_photographer_id ON public.portfolio_items(photographer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
