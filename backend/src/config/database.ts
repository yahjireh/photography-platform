/**
 * Database Configuration
 * Sets up Prisma Client for database access
 */

import { PrismaClient } from '@prisma/client';

/**
 * TEACHING MOMENT: What is Prisma Client?
 * 
 * PrismaClient is an auto-generated database client that:
 * 1. Provides type-safe database queries
 * 2. Handles connections automatically
 * 3. Converts between database format and JavaScript objects
 * 
 * Example:
 * Instead of: SELECT * FROM users WHERE email = 'test@example.com'
 * We write: prisma.user.findUnique({ where: { email: 'test@example.com' }})
 */

/**
 * TEACHING MOMENT: Prisma 7 Client Configuration
 * 
 * In Prisma 7, database connection is configured in prisma.config.ts
 * The client automatically reads that configuration
 */

// Create a single Prisma Client instance
// We use a single instance to avoid creating too many database connections
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']  // In development: log all queries (helps debugging)
    : ['error'],                  // In production: only log errors
});

/**
 * TEACHING MOMENT: Why do we export a single instance?
 * 
 * ❌ BAD: Creating new PrismaClient() in every file
 * - Opens multiple database connections
 * - Wastes resources
 * - Can cause "too many connections" errors
 * 
 * ✅ GOOD: Import the same prisma instance everywhere
 * - Single connection pool
 * - Efficient resource usage
 * - Better performance
 */

export default prisma;