/**
 * Main Server File
 * Entry point for the backend application
 */
process.stdout.write('🔥 SERVER FILE LOADING...\n');
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import photographerRoutes from './routes/photographer.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import { paystackWebhook } from './controllers/payment.controller';
import { validatePaystackConfig } from './config/paystack';
import photoRoutes from './routes/photo.routes';
import { validateStorageConfig } from './config/storage';
import path from 'path';
import notificationRoutes from './routes/notification.routes';
import { validateEmailConfig } from './config/email';
import availabilityRoutes from './routes/availability.routes';
import reviewRoutes from './routes/review.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes from './routes/admin.routes';
import packageRoutes from './routes/package.routes';
import supportRoutes from './routes/support.routes';
import { generalApiLimiter, webhookLimiter } from './middleware/rate-limiter.middleware';
import { recordRequest } from './services/metrics.service';

/**
 * TEACHING MOMENT: Load environment variables
 * 
 * dotenv loads variables from .env file into process.env
 * This must happen BEFORE we try to access process.env.PORT, etc.
 */
dotenv.config();

/**
 * TEACHING MOMENT: What is Express?
 * 
 * Express is a web application framework for Node.js
 * It handles:
 * - HTTP requests and responses
 * - Routing (mapping URLs to functions)
 * - Middleware (functions that process requests)
 * - Sending responses (JSON, HTML, files, etc.)
 */

// Create Express application
const app = express();

// Trust first proxy (Render, Vercel, Cloudflare) for accurate client IP resolution
app.set('trust proxy', 1);

/**
 * Get port from environment variables, default to 3000
 */
const PORT = process.env.PORT || 3000;

/**
 * ============================================
 * MIDDLEWARE SETUP
 * ============================================
 * 
 * TEACHING MOMENT: What is Middleware?
 * 
 * Middleware = Functions that run BEFORE your route handlers
 * 
 * Request → Middleware 1 → Middleware 2 → Route Handler → Response
 * 
 * Examples:
 * - Parse JSON body
 * - Enable CORS
 * - Authenticate user
 * - Log requests
 */

/**
 * CORS Middleware
 * 
 * TEACHING MOMENT: What is CORS?
 * 
 * CORS = Cross-Origin Resource Sharing
 * 
 * By default, browsers block requests from:
 * http://localhost:8081 (React Native app)
 * to
 * http://localhost:3000 (our API)
 * 
 * This is a security feature called "Same-Origin Policy"
 * 
 * CORS middleware tells the browser: "It's OK, allow these requests"
 */
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.CLIENT_APP_URL,
      process.env.ADMIN_DASHBOARD_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost',
      'https://localhost',
      'capacitor://localhost',
      'ionic://localhost',
    ].filter(Boolean);

    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('https://localhost:') ||
      origin.startsWith('capacitor://') ||
      origin.startsWith('ionic://') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    // Default allow for seamless API usage across mobile webviews
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

/**
 * JSON Body Parser Middleware
 * 
 * TEACHING MOMENT: Parsing request body
 * 
 * When client sends:
 * POST /api/auth/register
 * Body: {"email": "john@example.com", "password": "pass123"}
 * 
 * Without this middleware:
 *   req.body is undefined ❌
 * 
 * With this middleware:
 *   req.body = { email: 'john@example.com', password: 'pass123' } ✅
 * 
 * It automatically converts JSON string → JavaScript object
 */
app.use(express.json());

/**
 * URL-encoded Body Parser Middleware
 * 
 * For parsing form data (application/x-www-form-urlencoded)
 * Example: email=john@example.com&password=pass123
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Live Metrics & Telemetry Recording Middleware
 */
app.use((_req: Request, res: Response, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    recordRequest(res.statusCode, duration);
  });
  next();
});

/**
 * Request Logger Middleware (simple)
 * 
 * Logs every incoming request
 * Helpful for debugging
 */
app.use((req: Request, _res: Response, next) => {
  console.log('\n');
  console.log('🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵');
  console.log('🔵 REQUEST RECEIVED!');
  console.log('🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Time:', new Date().toISOString());
  console.log('🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵🔵');
  console.log('\n');
  next();
});

// ✅ ADD THIS SUPER SIMPLE TEST MIDDLEWARE
app.use((_req: Request, _res: Response, next) => {
  console.log('🟢 SIMPLE TEST MIDDLEWARE WORKS!');
  next();
});

/**
 * TEACHING MOMENT: next()
 * 
 * Middleware can:
 * 1. Modify req or res objects
 * 2. End the request-response cycle (send response)
 * 3. Call next() to pass to next middleware
 * 
 * If you don't call next(), the request hangs (never gets to route handler)!
 */

/**
 * ============================================
 * STORAGE SETUP
 * ============================================
 */
/**
 * Validate storage configuration on startup
 */
try {
  validateStorageConfig();
} catch (error: any) {
  console.error('❌ Storage configuration error:', error.message);
  process.exit(1);
}

/**
 * Serve static files for local storage mode
 * 
 * TEACHING MOMENT: Static File Serving
 * 
 * When using local storage, uploaded photos need to be accessible via HTTP.
 * Express can serve static files from a directory.
 * 
 * If photo is saved at: ./uploads/photos/photo-123.jpg
 * It becomes accessible at: http://localhost:3000/uploads/photos/photo-123.jpg
 * 
 * This only works in local mode. In production with R2, files are served from Cloudflare.
 */
if (process.env.STORAGE_MODE === 'local') {
  const uploadsPath = path.join(__dirname, '..', process.env.UPLOADS_DIR || 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log(`📁 Serving static files from: ${uploadsPath}`);
}

try {
  validateEmailConfig();
} catch (error: any) {
  console.error('❌ Email configuration error:', error.message);
}


/**
 * ============================================
 * ROUTES SETUP
 * ============================================
 */

/**
 * Test route - Check if server is running
 * GET /
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Photography Platform API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      photographers: '/api/photographers',
      bookings: '/api/bookings',
      health: '/health'
    }
  });
});

/**
 * Health check endpoint
 * GET /health
 * 
 * Used by monitoring services to check if API is alive
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Mount authentication routes
 * 
 * TEACHING MOMENT: Route mounting
 * 
 * app.use(PREFIX, ROUTER)
 * 
 * All routes in authRoutes will be prefixed with '/api/auth'
 * 
 * authRoutes has:
 * - POST /register
 * - POST /login
 * 
 * After mounting with '/api/auth':
 * - POST /api/auth/register
 * - POST /api/auth/login
 */

/** Mount payment routes
 * Paystack Webhook Endpoint (protected by webhookLimiter against DDoS/HMAC exhaustion)
 */
app.post('/api/webhooks/paystack', webhookLimiter, paystackWebhook);

/**
 * Apply general API rate limiting to all /api endpoints
 */
app.use('/api', generalApiLimiter);

/**
 * Mount authentication routes
 */
app.use('/api/auth', authRoutes);

/**
 * Mount user routes (protected)
 */
app.use('/api/users', userRoutes);

/**
 * Mount photographer routes (mixed public/protected)
 */
app.use('/api/photographers', photographerRoutes);

/**
 * Mount package routes
 */
app.use('/api/packages', packageRoutes);

/**
 * Mount booking routes (protected)
 * All booking operations require authentication
 */
app.use('/api/bookings', bookingRoutes);

/** Mount payment routes
 * Paystack Webhook Endpoint
 */
app.use('/api/payments', paymentRoutes);

/**
 * Mount photo routes
 * Handles photo upload, delivery, and download
 */
app.use('/api', photoRoutes);

/**
 * Mount notification routes
 * Handles in-app notifications
 */
app.use('/api/notifications', notificationRoutes);

/** Mount availability routes
 * Handles photographer availability management
 */
app.use('/api/availability', availabilityRoutes);

/** Mount review routes
 * Handles reviews and ratings
 */
app.use('/api/reviews', reviewRoutes);

/**
 * Mount message routes (protected)
 * All messaging operations require authentication
 */
app.use('/api/messages', messageRoutes);

/**
 * Mount support routes (Client/Photographer contact support)
 */
app.use('/api/support', supportRoutes);

/**
 * Mount admin routes (ADMIN only)
 */
app.use('/api/admin', adminRoutes);

/**
 * 404 Handler - Route not found
 * 
 * TEACHING MOMENT: Catch-all route
 * 
 * This runs if NO other route matched the request
 * Must be defined AFTER all other routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

/**
 * Global Error Handler
 * 
 * TEACHING MOMENT: Error handling middleware
 * 
 * Error middleware has 4 parameters: (err, req, res, next)
 * Express knows it's error middleware because of the 4 parameters
 * 
 * If any route or middleware throws an error, it comes here
 */
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * ============================================
 * START SERVER
 * ============================================
 */

/**
 * Start listening for requests
 * 
 * TEACHING MOMENT: Starting the server
 * 
 * app.listen(PORT) tells Express to:
 * 1. Open a network port (e.g., 3000)
 * 2. Listen for incoming HTTP requests on that port
 * 3. Process requests using our routes and middleware
 */
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================');
  // Validate Paystack configuration
  try {
    validatePaystackConfig();
  } catch (error: any) {
    console.error('⚠️  Paystack configuration error:', error.message);
  }
  console.log('Available endpoints:');
  console.log('');
  console.log('📋 General:');
  console.log(`  GET  /                                    - API info`);
  console.log(`  GET  /health                              - Health check`);
  console.log('');
  console.log('🔐 Authentication:');
  console.log(`  POST /api/auth/register                   - Register user`);
  console.log(`  POST /api/auth/login                      - Login user`);
  console.log('');
  console.log('👤 User Management:');
  console.log(`  GET  /api/users/me                        - Get profile (protected)`);
  console.log(`  PATCH /api/users/me                       - Update profile (protected)`);
  console.log(`  GET  /api/users/photographer-stats        - Get stats (photographer only)`);
  console.log('');
  console.log('📸 Photographers (Public):');
  console.log(`  GET  /api/photographers/search            - Search photographers`);
  console.log(`  GET  /api/photographers/:id               - View photographer profile`);
  console.log('');
  console.log('📸 Photographers (Protected):');
  console.log(`  GET    /api/photographers/me              - Get own profile`);
  console.log(`  PATCH  /api/photographers/profile         - Update profile`);
  console.log(`  POST   /api/photographers/portfolio       - Add portfolio item`);
  console.log(`  PATCH  /api/photographers/portfolio/:id   - Update portfolio item`);
  console.log(`  DELETE /api/photographers/portfolio/:id   - Delete portfolio item`);
  console.log('');
  console.log('📅 Bookings:');
  console.log(`  POST  /api/bookings                       - Create booking (client)`);
  console.log(`  GET   /api/bookings/my-bookings           - Get my bookings`);
  console.log(`  GET   /api/bookings/:id                   - Get booking details`);
  console.log(`  PATCH /api/bookings/:id/accept            - Accept booking (photographer)`);
  console.log(`  PATCH /api/bookings/:id/reject            - Reject booking (photographer)`);
  console.log(`  PATCH /api/bookings/:id/cancel            - Cancel booking`);
  console.log(`  PATCH /api/bookings/:id/start             - Start shoot (photographer)`);
  console.log(`  PATCH /api/bookings/:id/complete          - Complete shoot (photographer)`);
  console.log(`  PATCH /api/bookings/:id/deliver           - Deliver photos (photographer)`);
  console.log('');
  console.log('💰 Payments:');
  console.log(`  POST /api/payments/deposit/initialize     - Initialize deposit payment (40%)`);
  console.log(`  POST /api/payments/balance/initialize     - Initialize balance payment (60%)`);
  console.log(`  POST /api/payments/deposit/release        - Release deposit to photographer (ADMIN)`);
  console.log(`  POST /api/payments/balance/release        - Release balance to photographer (ADMIN)`);
  console.log(`  GET  /api/payments/banks                  - List available banks`);
  console.log(`  POST /api/payments/resolve-account        - Verify bank account details`);
  console.log(`  POST /api/payments/subaccount             - Create photographer subaccount`);
  console.log(`  GET  /api/payments/callback               - Payment callback (public)`);
  console.log(`  POST /api/webhooks/paystack               - Paystack webhook (public)`);
  console.log('');
  console.log('📸 Photos:');
  console.log(`  POST   /api/bookings/:id/photos              - Upload photos (photographer)`);
  console.log(`  GET    /api/bookings/:id/photos              - Get booking photos`);
  console.log(`  POST   /api/bookings/:id/photos/deliver      - Mark as delivered (photographer)`);
  console.log(`  GET    /api/bookings/:id/photos/download-all - Download all as ZIP`);
  console.log(`  GET    /api/photos/:id                       - Get single photo`);
  console.log(`  GET    /api/photos/:id/download              - Download photo`);
  console.log(`  DELETE /api/photos/:id                       - Delete photo (photographer)`);
  console.log('');
  console.log('🔔 Notifications:');
  console.log(`  GET    /api/notifications                  - Get notifications`);
  console.log(`  GET    /api/notifications/unread-count     - Badge count`);
  console.log(`  PATCH  /api/notifications/:id/read         - Mark as read`);
  console.log(`  PATCH  /api/notifications/read-all         - Mark all as read`);
  console.log(`  DELETE /api/notifications/:id              - Delete notification`);
  console.log(`  DELETE /api/notifications/read             - Delete all read`);
  console.log('');
  console.log('📅 Availability:');
  console.log(`  POST   /api/availability                      - Set single date`);
  console.log(`  POST   /api/availability/bulk                 - Set multiple dates`);
  console.log(`  POST   /api/availability/recurring            - Set recurring pattern`);
  console.log(`  GET    /api/availability/range                - Get date range`);
  console.log(`  GET    /api/availability/calendar/:year/:month - Get month view`);
  console.log(`  GET    /api/availability/check/:id/:date      - Check availability (public)`);
  console.log(`  GET    /api/availability/search               - Search available photographers`);
  console.log(`  DELETE /api/availability/:id                  - Delete availability`);
  console.log('');
  console.log('⭐ Reviews:');
  console.log(`  POST   /api/reviews                            - Submit review (protected)`);
  console.log(`  GET    /api/reviews/photographer/:id           - Get photographer reviews (public)`);
  console.log(`  GET    /api/reviews/photographer/:id/stats     - Get rating stats (public)`);
  console.log(`  GET    /api/reviews/my-reviews                 - Get own reviews (protected)`);
  console.log(`  GET    /api/reviews/reviewable-bookings        - Get bookings to review (protected)`);
  console.log(`  GET    /api/reviews/can-review/:bookingId      - Check eligibility (protected)`);
  console.log(`  PATCH  /api/reviews/:id/visibility             - Hide/show review (protected)`);
  console.log(`  GET    /api/reviews/:id                        - Get single review (public)`);
  console.log('');
  console.log('💬 Messages:');
  console.log(`  POST   /api/messages                              - Send message`);
  console.log(`  GET    /api/messages/conversations                - List conversations`);
  console.log(`  GET    /api/messages/conversation/:bookingId      - Get messages`);
  console.log(`  PATCH  /api/messages/read                         - Mark as read`);
  console.log(`  GET    /api/messages/unread-count                 - Unread count`);
  console.log(`  DELETE /api/messages/:id                          - Delete message`);
  console.log(`  GET    /api/messages/search                       - Search messages`);
  console.log('');
  console.log('========================================');
});
/**
 * COMPLETE REQUEST FLOW EXAMPLE:
 * 
 * Client sends: POST http://localhost:3000/api/auth/register
 * Body: { "email": "john@example.com", "password": "pass123", ... }
 * 
 * 1. Request arrives at Express server
 * 2. CORS middleware → Adds CORS headers
 * 3. JSON middleware → Parses body: req.body = { email: '...', ... }
 * 4. Logger middleware → Logs: "[2026-01-06] POST /api/auth/register"
 * 5. Routes check → Matches /api/auth prefix → Goes to authRoutes
 * 6. authRoutes check → Matches POST /register → Calls register controller
 * 7. register controller → Validates, calls registerUser service
 * 8. registerUser service → Multiple async operations (await database, etc.)
 * 9. Service returns result → Controller sends JSON response
 * 10. Response sent back to client
 * 
 * Total time: 100-500ms (depending on database, password hashing)
 */

/**
 * TEACHING MOMENT: How Node.js handles multiple requests
 * 
 * Node.js is SINGLE-THREADED but handles many requests concurrently!
 * 
 * How?
 * - When an await is hit, Node.js doesn't wait idly
 * - It handles OTHER requests while waiting for database/etc.
 * - When database responds, it continues that request
 * 
 * Example with 3 simultaneous requests:
 * 
 * Request A: Register user
 * - Validate input
 * - await hashPassword() ← WAITING (50ms)
 * 
 * While A waits, Node.js handles:
 * 
 * Request B: Login user  
 * - Validate input
 * - await findUser() ← WAITING (20ms)
 * 
 * While A and B wait, Node.js handles:
 * 
 * Request C: Health check
 * - Return JSON (instant, no await)
 * - Done! ✓
 * 
 * B's database responds → Complete B → Done! ✓
 * A's hash completes → Continue A → await createUser() → Done! ✓
 * 
 * All 3 requests handled "simultaneously" with 1 thread!
 * This is the power of async/await and the Node.js event loop
 */