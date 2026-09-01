/**
 * Express Type Extensions
 * Extends Express Request type to include authenticated user
 */

import { JwtPayload } from '../utils/jwt.utils';

/**
 * TEACHING MOMENT: What is a .d.ts file?
 * 
 * .d.ts = TypeScript Declaration file
 * Used to add or modify type definitions
 * 
 * Here, we're telling TypeScript:
 * "The Express Request object can have a 'user' property"
 * 
 * Without this, TypeScript would error:
 * req.user ❌ Property 'user' does not exist on type 'Request'
 * 
 * With this:
 * req.user ✅ TypeScript knows about it!
 */

/**
 * Extend Express namespace
 * This modifies the global Express types
 */
declare global {
  namespace Express {
    /**
     * Add user property to Request interface
     *
     * After authentication middleware runs:
     * req.user will contain: { user_id, email, user_type }
     */
    interface Request {
      user?: JwtPayload;  // ? means optional (won't exist before auth middleware)
    }
  }
}

/**
 * This export is required for module augmentation to work
 * It makes TypeScript treat this file as a module
 */
export {};

/**
 * HOW THIS WORKS:
 * 
 * Before authentication:
 * req.user = undefined
 * 
 * After authentication middleware:
 * req.user = {
 *   user_id: "abc123",
 *   email: "user@example.com",
 *   user_type: "CLIENT"
 * }
 *
 * In your controllers, you can now access:
 * const user_id = req.user?.user_id;  // TypeScript knows this exists!
 */