/**
 * Package Routes
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as PackageController from '../controllers/package.controller';

const router = express.Router();

// Protected routes (Photographer only)
router.get(
  '/me',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PackageController.getMyPackages
);

// Public routes
router.get('/photographer/:photographerId', PackageController.getPhotographerPackages);
router.get('/:id', PackageController.getPackageById);

// Protected routes (Photographer only)
router.post(
  '/',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PackageController.createPackage
);

router.patch(
  '/:id',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PackageController.updatePackage
);

router.delete(
  '/:id',
  authenticate,
  authorize('PHOTOGRAPHER'),
  PackageController.deletePackage
);

export default router;
