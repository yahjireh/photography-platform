# Plan: Connect Mobile Apps to Backend API

## Port Allocation (No Conflicts)
| Service | Port |
|---------|------|
| Backend API | 3000 |
| Admin Dashboard | 3001 |
| Client App | 3002 |
| Photographer App | 3003 |

---

## Phase 1: Shared Infrastructure (create in `apps/shared/src/`)

**Install dependencies** (axios, @tanstack/react-query, react-hot-toast) into shared package.

**New files:**
1. `shared/src/lib/api-client.ts` — Axios instance, JWT tokenManager, request/response interceptors, `api` helper, `extractData`, `handleApiError`
2. `shared/src/lib/query-keys.ts` — QUERY_KEYS constant for cache management
3. `shared/src/lib/auth-context.tsx` — AuthContext + AuthProvider (replaces localStorage mock auth)
4. `shared/src/lib/providers.tsx` — Combined QueryClientProvider + AuthProvider + Toaster
5. `shared/src/hooks/use-auth.ts` — useLogin, useRegister, useLogout
6. `shared/src/hooks/use-notifications.ts` — useNotifications, useMarkRead
7. `shared/src/hooks/use-messages.ts` — useConversations, useConversationMessages, useSendMessage

**Modify:**
- `shared/src/index.ts` — add new exports
- `client/.env.local` + `photographer/.env.local` — add `VITE_API_URL=http://localhost:3000/api`

---

## Phase 2: Auth Flow (Replace Mock Auth)

**Modify:**
- `client/src/main.tsx` — wrap in `<AppProviders>`
- `photographer/src/main.tsx` — wrap in `<AppProviders>`
- `shared/src/pages/Login.tsx` — replace `setTimeout` with `useLogin().mutate()`
- `shared/src/pages/Signup.tsx` — replace `setTimeout` with `useRegister().mutate()`
- `client/src/App.tsx` — use `useAuthContext()` instead of localStorage checks
- `photographer/src/App.tsx` — use `useAuthContext()` instead of localStorage checks

---

## Phase 3: Client App Hooks (create in `apps/client/src/hooks/`)

1. `use-photographers.ts` — usePhotographerSearch, usePhotographerDetail (GET /api/photographers/search, GET /api/photographers/:id)
2. `use-bookings.ts` — useMyBookings, useCreateBooking, useCancelBooking (POST /api/bookings, GET /api/bookings/my-bookings)
3. `use-reviews.ts` — usePhotographerReviews, useCreateReview (GET /api/reviews/photographer/:id, POST /api/reviews)
4. `use-payments.ts` — useInitializeDeposit, useInitializeBalance (POST /api/payments/deposit/initialize)

---

## Phase 4: Photographer App Hooks (create in `apps/photographer/src/hooks/`)

1. `use-photographer-bookings.ts` — usePhotographerBookings, useBookingAction (accept/reject/start/complete/deliver)
2. `use-availability.ts` — useAvailabilityRange, useSetAvailability, useBulkAvailability, useRecurringAvailability
3. `use-portfolio.ts` — useAddPortfolioItem, useUpdatePortfolioItem, useDeletePortfolioItem
4. `use-photographer-profile.ts` — usePhotographerProfile, useUpdatePhotographerProfile
5. `use-photos.ts` — useBookingPhotos, useUploadPhotos, useDeliverPhotos

---

## Phase 5: Page-by-Page Migration (replace mock data with hooks)

**Client pages (in order):**
1. Home.tsx — replace MOCK_PHOTOGRAPHERS with usePhotographerSearch()
2. Explore.tsx — replace MOCK_PHOTOGRAPHERS with usePhotographerSearch({ category })
3. PhotographerDetail.tsx — use usePhotographerDetail(id), usePhotographerReviews(id), useCreateBooking()
4. Bookings.tsx — replace MOCK_BOOKINGS with useMyBookings(), wire useCancelBooking()
5. Messages.tsx — replace MOCK_CONVERSATIONS with useConversations()
6. ChatDetail.tsx — replace MOCK_CHAT_HISTORY with useConversationMessages(), wire useSendMessage()
7. Profile.tsx — replace hardcoded data with useAuthContext().user

**Photographer pages (in order):**
1. Dashboard.tsx — use usePhotographerProfile() + usePhotographerBookings() for stats
2. Requests.tsx — use usePhotographerBookings() filtered by PENDING, wire useBookingAction()
3. Schedule.tsx — use useAvailabilityRange(), wire useSetAvailability()
4. Studio.tsx — use usePhotographerProfile(), usePhotographerReviews(), wire portfolio mutations
5. KYC.tsx — wire to backend KYC endpoints

---

## Key Patterns
- **snake_case → camelCase transformation** happens in each hook's queryFn (same as admin dashboard)
- **401 handling**: interceptor dispatches `CustomEvent('auth:logout')`, AuthContext listens and clears user
- **Gradual migration**: each page can switch from mocks to real API independently
- **16 new files** created, **8 existing files** modified

## Total: 5 phases, ~24 file operations
