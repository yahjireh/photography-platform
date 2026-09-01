/**
 * Password Hashing Utilities
 * Functions to securely hash and verify passwords
 */

import bcrypt from 'bcryptjs';

/**
 * TEACHING MOMENT: Why hash passwords?
 * 
 * ❌ NEVER store plain text passwords in database!
 * If database is hacked, all passwords are exposed.
 * 
 * Password: "mypassword123"
 * Hashed:   "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
 * 
 * Hashing is ONE-WAY:
 * - Can convert password → hash
 * - Cannot convert hash → password
 * 
 * To verify: hash the login password and compare hashes
 */

/**
 * Hash a plain text password
 * 
 * @param password - The plain text password to hash
 * @returns Promise that resolves to the hashed password
 * 
 * TEACHING MOMENT: This is an ASYNC function!
 * It returns a Promise because hashing takes time (intentionally slow for security)
 */
export async function hashPassword(password: string): Promise<string> {
  /**
   * TEACHING MOMENT: The 'await' keyword
   * 
   * bcrypt.hash() is an asynchronous operation (takes time)
   * Without 'await':
   *   const hash = bcrypt.hash(password, 10);  // ❌ Returns a Promise, not the actual hash!
   * 
   * With 'await':
   *   const hash = await bcrypt.hash(password, 10);  // ✅ Waits for completion, returns actual hash
   * 
   * The function PAUSES at 'await' until bcrypt.hash() finishes,
   * then continues with the result
   */
  
  // Salt rounds = 10 means password is hashed 2^10 (1024) times
  // Higher number = more secure but slower
  // 10 is a good balance
  const saltRounds = 10;
  
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  return hashedPassword;
  
  /**
   * Example:
   * Input:  "mypassword123"
   * Output: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
   */
}

/**
 * Compare a plain text password with a hashed password
 * 
 * @param password - The plain text password (from login form)
 * @param hashedPassword - The hashed password (from database)
 * @returns Promise that resolves to true if passwords match, false otherwise
 * 
 * TEACHING MOMENT: Another async function!
 */
export async function comparePassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  /**
   * TEACHING MOMENT: Try-Catch for Error Handling
   * 
   * Async operations can fail (network issues, invalid data, etc.)
   * We use try-catch to handle errors gracefully
   * 
   * try {
   *   // Code that might fail
   * } catch (error) {
   *   // What to do if it fails
   * }
   */
  
  try {
    // bcrypt.compare() internally:
    // 1. Takes the plain password
    // 2. Hashes it with the same salt from hashedPassword
    // 3. Compares the two hashes
    // 4. Returns true if they match, false otherwise
    const isMatch = await bcrypt.compare(password, hashedPassword);
    
    return isMatch;
    
    /**
     * Example:
     * password = "mypassword123"
     * hashedPassword = "$2a$10$N9qo8..." (from database)
     * Result: true (passwords match!)
     * 
     * password = "wrongpassword"
     * hashedPassword = "$2a$10$N9qo8..."
     * Result: false (passwords don't match)
     */
    
  } catch (error) {
    // If comparison fails, log error and return false
    console.error('Error comparing passwords:', error);
    return false;
  }
}

/**
 * SUMMARY: How password authentication works
 * 
 * REGISTRATION:
 * 1. User submits: email + "mypassword123"
 * 2. We call: hashPassword("mypassword123")
 * 3. Store in DB: email + "$2a$10$N9qo8..."
 * 
 * LOGIN:
 * 1. User submits: email + "mypassword123"
 * 2. We fetch hashed password from DB: "$2a$10$N9qo8..."
 * 3. We call: comparePassword("mypassword123", "$2a$10$N9qo8...")
 * 4. Returns: true (correct password!) or false (wrong password)
 */