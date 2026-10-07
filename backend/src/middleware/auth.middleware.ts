/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.utils';

// In-memory presence tracker for active sessions
export const userPresenceMap: Map<string, number> = new Map();

/**
 * Returns true if user has made an authenticated request in the last 3 minutes
 */
export function isUserOnline(userId: string): boolean {
  if (!userId) return false;
  const lastActive = userPresenceMap.get(userId);
  if (!lastActive) return false;
  return Date.now() - lastActive < 3 * 60 * 1000;
}

/**
 * TEACHING MOMENT: What is Middleware?
 * 
 * Middleware = Function that runs BEFORE your route handler
 * 
 * Flow without middleware:
 * Request → Route Handler → Response
 * 
 * Flow with middleware:
 * Request → Middleware (check auth) → Route Handler → Response
 *                ↓
 *           If not authenticated, return 401 error
 */

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 * 
 * @param req - Express Request
 * @param res - Express Response
 * @param next - Next function (call this to continue to route handler)
 * 
 * TEACHING MOMENT: How middleware works
 * 
 * Middleware has 3 outcomes:
 * 1. Call next() - Continue to next middleware/route handler
 * 2. Send response (res.json) - Stop here, don't continue
 * 3. Throw error - Goes to error handler
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  /**
   * TEACHING MOMENT: try-catch in middleware
   * 
   * If anything goes wrong (invalid token, etc.),
   * we catch it and send an error response
   */
  try {
    /**
     * STEP 1: Extract token from Authorization header
     * 
     * Client should send:
     * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     * 
     * We extract the token part (after "Bearer ")
     */
    const token = extractTokenFromHeader(req.headers.authorization);
    
    /**
     * STEP 2: Check if token exists
     * 
     * If no token provided, user is not authenticated
     */
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
      return;  // Stop execution, don't call next()
    }
    
    /**
     * STEP 3: Verify token
     * 
     * verifyToken() checks:
     * - Token signature is valid (not tampered)
     * - Token hasn't expired
     * - Token was created with our secret
     * 
     * Returns decoded payload or null if invalid
     */
    const decoded = verifyToken(token);
    
    /**
     * STEP 4: Check if token is valid
     */
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;  // Stop execution
    }
    
    /**
     * STEP 5: Attach user info to request
     * 
     * TEACHING MOMENT: This is the magic!
     * 
     * We add the user data to the request object
     * Now ALL subsequent middleware and route handlers
     * can access req.user to know who's logged in!
     * 
     * decoded contains:
     * {
     *   user_id: "abc123",
     *   email: "user@example.com",
     *   user_type: "CLIENT"
     * }
     */
    req.user = decoded;
    if (decoded?.user_id) {
      userPresenceMap.set(decoded.user_id, Date.now());
    }
    
    /**
     * STEP 6: Continue to next middleware/route handler
     * 
     * TEACHING MOMENT: Calling next()
     * 
     * This tells Express: "I'm done, continue to the next function"
     * Without next(), the request hangs (never reaches route handler)
     */
    next();
    
    /**
     * COMPLETE FLOW EXAMPLE:
     * 
     * Client sends: GET /api/users/me
     * Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     * 
     * 1. Request enters authenticate middleware
     * 2. Middleware extracts token
     * 3. Middleware verifies token → Valid!
     * 4. Middleware sets: req.user = { user_id: "abc123", ... }
     * 5. Middleware calls next()
     * 6. Request continues to route handler
     * 7. Route handler can access req.user.user_id to know who's requesting!
     */
    
  } catch (error) {
    /**
     * If any error occurs (token malformed, etc.),
     * return 401 Unauthorized
     */
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * TEACHING MOMENT: How to use this middleware
 * 
 * UNPROTECTED ROUTE (anyone can access):
 * router.get('/public', getPublicData);
 * 
 * PROTECTED ROUTE (must be logged in):
 * router.get('/private', authenticate, getPrivateData);
 *                        ^^^^^^^^^^^^
 *                        Middleware added here!
 * 
 * When client calls /private:
 * 1. authenticate middleware runs first
 * 2. If token valid → continues to getPrivateData
 * 3. If token invalid → stops at middleware, returns 401
 */

/**
 * Optional: Role-based authorization middleware
 * Checks if user has required role
 * 
 * TEACHING MOMENT: Authorization vs Authentication
 * 
 * Authentication: "Who are you?" (are you logged in?)
 * Authorization: "What can you do?" (do you have permission?)
 * 
 * Example:
 * - Authentication: User is logged in ✓
 * - Authorization: User is a PHOTOGRAPHER (not just CLIENT)
 */
export function authorize(...allowedRoles: string[]) {
  /**
   * This returns a middleware function
   * 
   * TEACHING MOMENT: Higher-Order Functions
   * 
   * authorize() is a function that RETURNS a function
   * This lets us pass parameters to middleware!
   * 
   * Usage:
   * router.post('/portfolio', authenticate, authorize('PHOTOGRAPHER'), createPortfolio)
   *                                          ^^^^^^^^^^^^^^^^^^^^^^^
   *                                          Only photographers allowed
   */
  return (req: Request, res: Response, next: NextFunction): void => {
    /**
     * STEP 1: Check if user exists (should exist after authenticate middleware)
     */
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    /**
     * STEP 2: Check if user's role is in allowed roles
     *
     * allowedRoles might be: ['PHOTOGRAPHER', 'ADMIN']
     * req.user.user_type might be: 'CLIENT'
     *
     * CLIENT is not in ['PHOTOGRAPHER', 'ADMIN']
     * → Access denied!
     */
    if (!allowedRoles.includes(req.user.user_type)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
      return;
    }
    
    /**
     * User has required role, continue!
     */
    next();
  };
}

/**
 * EXAMPLE USAGE IN ROUTES:
 * 
 * // Anyone can access (no middleware)
 * router.get('/photographers', getPhotographers);
 * 
 * // Must be logged in
 * router.get('/profile', authenticate, getProfile);
 * 
 * // Must be logged in AND be a photographer
 * router.post('/portfolio', authenticate, authorize('PHOTOGRAPHER'), addPortfolioItem);
 * 
 * // Must be logged in AND be admin
 * router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);
 * 
 * // Multiple roles allowed
 * router.get('/bookings', authenticate, authorize('CLIENT', 'PHOTOGRAPHER'), getBookings);
 */

/**
 * HTTP STATUS CODES USED:
 * 
 * 401 Unauthorized - Authentication failed
 *     "You're not logged in" or "Your token is invalid"
 * 
 * 403 Forbidden - Authorization failed
 *     "You're logged in, but you don't have permission"
 *     Example: CLIENT trying to access PHOTOGRAPHER-only route
 */