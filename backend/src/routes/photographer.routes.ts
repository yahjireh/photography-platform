/**
 * Photographer Routes
 * API endpoints for photographer profile and portfolio management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  updateProfile,
  getMyProfile,
  getPublicProfile,
  searchPhotographersController,
  addPortfolio,
  updatePortfolio,
  deletePortfolio,
  submitKYC,
  getMyKYC
} from '../controllers/photographer.controller';

const router = express.Router();

/**
 * TEACHING MOMENT: Route Organization
 * 
 * Routes are organized by:
 * - PUBLIC routes (anyone can access)
 * - PROTECTED routes (must be logged in)
 * - ROLE-SPECIFIC routes (must be photographer)
 */

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/photographers/search
 * Search for photographers by location, services, rating, etc.
 * 
 * PUBLIC: Clients need to search without logging in
 */
router.get('/search', searchPhotographersController);

// ============================================
// PROTECTED ROUTES (Photographer only)
// ============================================

/**
 * GET /api/photographers/me
 * Get own photographer profile with full details
 * 
 * PROTECTED: Must be logged in as photographer
 * 
 * CRITICAL: This MUST come before /:id route!
 * If /:id came first, '/me' would match as id='me' and call wrong handler
 */
router.get('/me', authenticate, authorize('PHOTOGRAPHER'), getMyProfile);

/**
  * GET /api/photographers/kyc/me
  * Get own KYC verification status, draft data, and documents for editing
  * 
  * PROTECTED: Must be logged in as photographer
  */
router.get('/kyc/me', authenticate, authorize('PHOTOGRAPHER'), getMyKYC);

// ============================================
// PUBLIC ROUTES (Dynamic - Must be last!)
// ============================================

/**
 * GET /api/photographers/:id
 * Get public profile of a specific photographer
 * 
 * PUBLIC: Anyone can view photographer profiles
 * 
 * TEACHING MOMENT: Route Order Matters!
 * This MUST come AFTER specific routes like /search and /me
 * Dynamic routes should always be defined LAST!
 * 
 * Correct Order:
 * ✅ /search (specific route)
 * ✅ /me (specific route)
 * ✅ /:id (dynamic route - catches everything else)
 * 
 * Wrong order:
 * ❌ /:id (would match '/search' as id='search' and '/me' as id='me')
 * ❌ /search (never reached!)
 * ❌ /me (never reached!)
 */
router.get('/:id', getPublicProfile);

/**
 * PATCH /api/photographers/profile
 * Update photographer profile (bio, services, rates, etc.)
 * 
 * PROTECTED: Must be logged in as photographer
 */
router.patch('/profile', authenticate, authorize('PHOTOGRAPHER'), updateProfile);

/**
 * POST /api/photographers/kyc
 * Submit KYC verification data and documents
 * 
 * PROTECTED: Must be logged in as photographer
 */
router.post('/kyc', authenticate, authorize('PHOTOGRAPHER'), submitKYC);

/**
 * POST /api/photographers/portfolio
 * Add new portfolio item
 * 
 * PROTECTED: Must be logged in as photographer
 */
router.post('/portfolio', authenticate, authorize('PHOTOGRAPHER'), addPortfolio);

/**
 * PATCH /api/photographers/portfolio/:id
 * Update portfolio item
 * 
 * PROTECTED: Must be logged in as photographer (ownership checked in service)
 */
router.patch('/portfolio/:id', authenticate, authorize('PHOTOGRAPHER'), updatePortfolio);

/**
 * DELETE /api/photographers/portfolio/:id
 * Delete portfolio item
 * 
 * PROTECTED: Must be logged in as photographer (ownership checked in service)
 */
router.delete('/portfolio/:id', authenticate, authorize('PHOTOGRAPHER'), deletePortfolio);

export default router;

/**
 * COMPLETE URL MAPPING (when mounted at /api/photographers):
 * 
 * PUBLIC ROUTES:
 * GET    /api/photographers/search           - Search photographers
 * GET    /api/photographers/:id              - View photographer profile
 * 
 * PHOTOGRAPHER-ONLY ROUTES:
 * GET    /api/photographers/me               - Get own profile (full details)
 * PATCH  /api/photographers/profile          - Update profile
 * POST   /api/photographers/portfolio        - Add portfolio item
 * PATCH  /api/photographers/portfolio/:id    - Update portfolio item
 * DELETE /api/photographers/portfolio/:id    - Delete portfolio item
 */

/**
 * TEACHING MOMENT: HTTP Methods Meaning
 * 
 * GET    - Retrieve data (read)
 * POST   - Create new resource
 * PATCH  - Update partial resource
 * PUT    - Replace entire resource
 * DELETE - Remove resource
 * 
 * We use PATCH (not PUT) because:
 * - PATCH: Update some fields (e.g., just bio)
 * - PUT: Must send ALL fields (replace entire profile)
 * 
 * PATCH is more flexible for updates!
 */

/**
 * TESTING EXAMPLES:
 * 
 * 1. Search photographers in Accra:
 *    GET /api/photographers/search?location_city=Accra
 * 
 * 2. Search wedding photographers with rating 4+:
 *    GET /api/photographers/search?occasion_type=WEDDING&min_rating=4
 * 
 * 3. View specific photographer:
 *    GET /api/photographers/abc-123-def
 * 
 * 4. Get your own profile (with token):
 *    GET /api/photographers/me
 *    Headers: Authorization: Bearer <token>
 * 
 * 5. Update your profile (with token):
 *    PATCH /api/photographers/profile
 *    Headers: Authorization: Bearer <token>
 *    Body: { "bio": "Professional wedding photographer", "hourly_rate": 200 }
 * 
 * 6. Add portfolio item (with token):
 *    POST /api/photographers/portfolio
 *    Headers: Authorization: Bearer <token>
 *    Body: {
 *      "image_url": "https://example.com/photo.jpg",
 *      "thumbnail_url": "https://example.com/photo-thumb.jpg",
 *      "occasion_type": "WEDDING",
 *      "title": "Beautiful Wedding in Accra"
 *    }
 */