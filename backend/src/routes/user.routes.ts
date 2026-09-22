/**
 * User Routes
 * Protected routes that require authentication
 */

import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getCurrentUser,
  updateCurrentUser,
  uploadAvatar,
  getPhotographerStats,
  deleteCurrentUser
} from '../controllers/user.controller';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

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
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/users/avatar
 * Upload avatar directly (multipart/form-data)
 * 
 * PROTECTED: Must be logged in
 */
router.post('/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);

/**
 * PATCH /api/users/me
 * Update current user's profile
 * 
 * PROTECTED: Must be logged in
 */
router.patch('/me', authenticate, updateCurrentUser);

/**
 * DELETE /api/users/me
 * Delete current user's account and all associated resources
 * 
 * PROTECTED: Must be logged in
 */
router.delete('/me', authenticate, deleteCurrentUser);

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