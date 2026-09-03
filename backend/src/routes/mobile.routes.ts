/**
 * Public Mobile Routes
 * Accessible by mobile clients (Vite/Capacitor apps) for startup sync,
 * version checks, feature flags, in-app messages, and crash telemetry.
 */

import { Router } from 'express';
import { getMobilePublicConfig, reportMobileCrash } from '../controllers/mobile.controller';

const router = Router();

/**
 * GET /api/mobile/config
 * Startup config sync for mobile clients
 */
router.get('/config', getMobilePublicConfig);

/**
 * POST /api/mobile/crashes
 * Error telemetry reporting from mobile apps
 */
router.post('/crashes', reportMobileCrash);

export default router;
