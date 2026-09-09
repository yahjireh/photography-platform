/**
 * Public Mobile Routes
 * Accessible by mobile clients (Vite/Capacitor apps) for startup sync,
 * version checks, feature flags, in-app messages, and crash telemetry.
 */

import { Router } from 'express';
import {
  getMobilePublicConfig,
  reportMobileCrash,
  recordMobileInAppMessageView,
  recordMobileInAppMessageClick
} from '../controllers/mobile.controller';

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

/**
 * POST /api/mobile/in-app-messages/:id/view
 * Record when a mobile user views an in-app message
 */
router.post('/in-app-messages/:id/view', recordMobileInAppMessageView);

/**
 * POST /api/mobile/in-app-messages/:id/click
 * Record when a mobile user clicks CTA on an in-app message
 */
router.post('/in-app-messages/:id/click', recordMobileInAppMessageClick);

export default router;
