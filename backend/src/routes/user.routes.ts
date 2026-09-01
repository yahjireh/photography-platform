/**
 * User Routes
 * Protected routes that require authentication
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getCurrentUser,
  updateCurrentUser,
  getPhotographerStats
} from '../controllers/user.controller';

/**
 * TEACHING MOMENT: Protected Routes Setup
 * 
 * These routes all require authentication
 * Some require specific roles (photographer-only)
 */

const router = express.Router();

/**
 * GET /api/users/me
 * Get current user's profile
 * 
 * PROTECTED: Must be logged in
 * 
 * TEACHING MOMENT: How middleware is applied
 * 
 * router.get(PATH, MIDDLEWARE, CONTROLLER)
 * 
 * Flow:
 * 1. Request comes in
 * 2. authenticate middleware runs
 *    - Checks token
 *    - Sets req.user if valid
 *    - Calls next() or returns 401
 * 3. If next() was called, controller runs
 * 4. Controller uses req.user to get data
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * PATCH /api/users/me
 * Update current user's profile
 * 
 * PROTECTED: Must be logged in
 */
router.patch('/me', authenticate, updateCurrentUser);

/**
 * GET /api/users/photographer-stats
 * Get photographer statistics
 * 
 * PROTECTED: Must be logged in AND be a photographer
 * 
 * TEACHING MOMENT: Multiple middleware
 * 
 * router.get(PATH, MIDDLEWARE1, MIDDLEWARE2, CONTROLLER)
 * 
 * Flow:
 * 1. Request comes in
 * 2. authenticate middleware runs
 *    - Verifies token
 *    - Sets req.user
 *    - Calls next()
 * 3. authorize('PHOTOGRAPHER') middleware runs
 *    - Checks if req.user.user_type === 'PHOTOGRAPHER'
 *    - If yes: calls next()
 *    - If no: returns 403 Forbidden
 * 4. If both next() called, controller runs
 */
router.get(
  '/photographer-stats',
  authenticate,
  authorize('PHOTOGRAPHER'),
  getPhotographerStats
);

/**
 * EXAMPLE: Admin-only route (for future)
 * 
 * router.get(
 *   '/all',
 *   authenticate,
 *   authorize('ADMIN'),
 *   getAllUsers
 * );
 * 
 * Only ADMIN users can access this
 */

export default router;

/**
 * COMPLETE ROUTE PROTECTION EXAMPLES:
 * 
 * PUBLIC ROUTE (anyone can access):
 * router.get('/public-data', getPublicData);
 * 
 * PROTECTED ROUTE (must be logged in):
 * router.get('/my-data', authenticate, getMyData);
 * 
 * ROLE-SPECIFIC ROUTE (must be logged in as photographer):
 * router.post('/portfolio', authenticate, authorize('PHOTOGRAPHER'), addPortfolio);
 * 
 * MULTIPLE ROLES (must be logged in as photographer OR admin):
 * router.get('/bookings', authenticate, authorize('PHOTOGRAPHER', 'ADMIN'), getBookings);
 * 
 * COMPLEX (photographer only, and they must update their own data):
 * router.patch('/portfolio/:id', authenticate, authorize('PHOTOGRAPHER'), checkOwnership, updatePortfolio);
 */

/**
 * HOW TO TEST THESE ROUTES:
 * 
 * 1. Login to get token:
 *    POST /api/auth/login
 *    Get token from response
 * 
 * 2. Use token in subsequent requests:
 *    GET /api/users/me
 *    Headers: Authorization: Bearer <your-token>
 * 
 * 3. Try without token:
 *    GET /api/users/me
 *    No Authorization header
 *    → Should get 401 Unauthorized
 * 
 * 4. Try wrong role:
 *    GET /api/users/photographer-stats
 *    Using CLIENT token
 *    → Should get 403 Forbidden
 */