/**
 * User Type Definitions
 * TypeScript interfaces for user-related data structures
 */

/**
 * TEACHING MOMENT: What are TypeScript interfaces?
 * 
 * Interfaces define the "shape" of an object
 * They help catch errors at compile-time (before running code)
 * 
 * Example:
 * interface Person {
 *   name: string;
 *   age: number;
 * }
 * 
 * const john: Person = { name: "John", age: 25 };  // ✅ Valid
 * const jane: Person = { name: "Jane" };           // ❌ Error: missing 'age'
 * const bob: Person = { name: "Bob", age: "30" };  // ❌ Error: age must be number
 */

/**
 * Registration data for a new user
 * This is what we expect from the client when registering
 */
export interface RegisterUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;        // Optional field (? means it can be undefined)
  user_type: 'CLIENT' | 'PHOTOGRAPHER';  // Must be one of these two values
  location_city?: string;
  location_country?: string;
}

/**
 * TEACHING MOMENT: Union Types
 *
 * user_type: 'CLIENT' | 'PHOTOGRAPHER'
 *
 * This means user_type can ONLY be:
 * - The string 'CLIENT', OR
 * - The string 'PHOTOGRAPHER'
 *
 * NOT:
 * - 'client' (wrong case)
 * - 'Admin' (not in the union)
 * - Any other string
 *
 * TypeScript will show an error if you try to use an invalid value!
 */

/**
 * Login credentials
 * This is what we expect from the client when logging in
 */
export interface LoginUserDto {
  email: string;
  password: string;
}

/**
 * Response data after successful registration or login
 * This is what we send back to the client
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string | null;
    location_city?: string | null;
    location_country?: string | null;
    user_type: string;
    profile_image_url: string | null;
    is_verified: boolean;
  };
  token: string;  // JWT token for authentication
}

/**
 * TEACHING MOMENT: Why separate interfaces for input and output?
 *
 * INPUT (RegisterUserDto):
 * - Contains sensitive data (password)
 * - Data before processing
 * - Might have optional/default values
 *
 * OUTPUT (AuthResponse):
 * - NO sensitive data (no password!)
 * - Data after processing
 * - Only what client needs to know
 *
 * Example:
 * Input:  { email, password, first_name, last_name }
 * Process: Hash password, save to database, generate token
 * Output: { user: { id, email, first_name, ... }, token }
 */

/**
 * User data without sensitive information
 * Used when returning user data in API responses
 */
export interface UserPublicData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  user_type: string;
  profile_image_url: string | null;
  location_city: string | null;
  location_country: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
}

/**
 * TEACHING MOMENT: null vs undefined
 *
 * In our database schema:
 * - Optional fields are stored as NULL in database
 * - In TypeScript, we represent this as "string | null"
 *
 * phone_number?: string       // Can be undefined (not provided)
 * phone_number: string | null // Can be null (explicitly no value) or string
 *
 * When fetching from database:
 * - Prisma returns null for empty fields
 * - So we use "string | null" for database-sourced data
 */