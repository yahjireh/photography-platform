-- ==============================================================================
-- ClickFlicks Supabase Security & Performance Remediation Script
-- ==============================================================================
-- This script resolves all Supabase Security & Performance Advisor warnings:
-- 1. "RLS Disabled in Public" (CRITICAL)
-- 2. "Sensitive Columns Exposed" (CRITICAL)
-- 3. "Public / Signed-in Users Can See Object in GraphQL Schema"
-- 4. "Unindexed Foreign Keys" (Performance)
--
-- SAFE FOR BACKEND:
-- Your Node.js/Express backend connects via Prisma using the database owner / connection
-- pooler ('postgres' role), which has the BYPASSRLS attribute. Enabling RLS and revoking
-- public/anon access does NOT affect your Express backend or Prisma operations at all.
-- It only secures direct public internet access through Supabase PostgREST & GraphQL.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: ENABLE ROW LEVEL SECURITY (RLS) ON ALL PUBLIC TABLES
-- Clears: "RLS Disabled in Public (CRITICAL)" & "Sensitive Columns Exposed"
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
-- STEP 2: REVOKE DIRECT REST & GRAPHQL API ACCESS FROM ANON / AUTHENTICATED
-- Clears: "Public Can See Object in GraphQL Schema"
--         "Signed-In Users Can See Object in GraphQL Schema"
-- ------------------------------------------------------------------------------
-- Revoke all table, sequence, and function access from public/anon/authenticated roles
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

-- Ensure newly created tables in public do not inherit permissions for anon/authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- Disable pg_graphql introspection on the public schema for unauthenticated API queries
COMMENT ON SCHEMA public IS '@graphql({"inflect": false})';

-- ------------------------------------------------------------------------------
-- STEP 3: CREATE INDEXES FOR UNINDEXED FOREIGN KEYS
-- Clears: "Unindexed Foreign Keys" performance warnings
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

-- Optional: reload PostgREST schema cache to immediately reflect updates
NOTIFY pgrst, 'reload schema';
