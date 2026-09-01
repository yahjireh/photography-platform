/**
 * JWT (JSON Web Token) Utilities
 * Functions to create and verify authentication tokens
 */

import jwt from 'jsonwebtoken';

/**
 * TEACHING MOMENT: What is a JWT Token?
 * 
 * JWT = JSON Web Token
 * It's a way to securely transmit information between client and server
 * 
 * When user logs in:
 * 1. Server creates a token with user info
 * 2. Server sends token to client
 * 3. Client stores token (in app memory)
 * 4. Client includes token in every request
 * 5. Server verifies token to identify user
 * 
 * Token looks like: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM..."
 * 
 * Token contains (but encrypted):
 * {
 *   user_id: "123",
 *   email: "user@example.com",
 *   user_type: "CLIENT",
 *   iat: 1234567890  // issued at (timestamp)
 *   exp: 1234567890  // expires at (timestamp)
 * }
 */

/**
 * Interface for the data stored inside the JWT token
 */
export interface JwtPayload {
  user_id: string;      // User's unique ID
  email: string;        // User's email
  user_type: string;    // CLIENT, PHOTOGRAPHER, or ADMIN
}

/**
 * Generate a JWT token for a user
 * 
 * @param payload - User information to encode in token
 * @returns JWT token string
 * 
 * TEACHING MOMENT: This function is synchronous (not async)
 * jwt.sign() is fast enough that we don't need to make it async
 */
export function generateToken(payload: JwtPayload): string {
  // Get JWT secret from environment variables
  const secret = process.env.JWT_SECRET;
  
  // Check if JWT_SECRET exists
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  /**
   * Create and return the token
   *
   * jwt.sign() takes 3 parameters:
   * 1. payload - The data to encode (user info)
   * 2. secret - Secret key to encrypt the token
   * 3. options - Configuration (expiration time, algorithm, etc.)
   */
  // @ts-ignore - Type definition issue with @types/jsonwebtoken
  const token = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  
  return token;
  
  /**
   * Example:
   * Input payload: { user_id: "abc123", email: "john@example.com", user_type: "CLIENT" }
   * Output token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYmMxMjM..."
   */
}

/**
 * Verify and decode a JWT token
 * 
 * @param token - The JWT token to verify
 * @returns Decoded payload if valid, null if invalid
 * 
 * TEACHING MOMENT: This uses try-catch for error handling
 * If token is invalid/expired, jwt.verify() throws an error
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    // Get JWT secret from environment variables
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    /**
     * Verify the token
     * 
     * jwt.verify() checks:
     * 1. Token signature is valid (not tampered with)
     * 2. Token hasn't expired
     * 3. Token was created with our secret key
     * 
     * If any check fails, it throws an error
     */
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    return decoded;
    
    /**
     * Example:
     * Input token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * Output: { user_id: "abc123", email: "john@example.com", user_type: "CLIENT" }
     */
    
  } catch (error) {
    /**
     * Common errors:
     * - "jwt expired" - Token too old
     * - "invalid signature" - Token was tampered with
     * - "jwt malformed" - Token format is wrong
     */
    
    // Log the error for debugging
    if (error instanceof Error) {
      console.error('JWT verification failed:', error.message);
    }
    
    // Return null for invalid tokens
    return null;
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader - The Authorization header value
 * @returns Token string or null
 * 
 * TEACHING MOMENT: Authorization header format
 * Header looks like: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * We need to extract just the token part (after "Bearer ")
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  // Check if header exists
  if (!authHeader) {
    return null;
  }
  
  // Check if it starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract token (everything after "Bearer ")
  const token = authHeader.substring(7); // "Bearer ".length = 7
  
  return token;
  
  /**
   * Example:
   * Input: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
}

/**
 * SUMMARY: JWT Authentication Flow
 * 
 * LOGIN:
 * 1. User sends email + password
 * 2. Server verifies credentials
 * 3. Server calls: generateToken({ user_id, email, user_type })
 * 4. Server sends token to client
 * 5. Client stores token
 * 
 * SUBSEQUENT REQUESTS:
 * 1. Client includes token in header: "Authorization: Bearer <token>"
 * 2. Server calls: extractTokenFromHeader(req.headers.authorization)
 * 3. Server calls: verifyToken(token)
 * 4. If valid: Server knows who the user is
 * 5. If invalid: Server rejects request (401 Unauthorized)
 */