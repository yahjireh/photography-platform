/**
 * Package Controller
 * HTTP request handlers for packages
 */

import { Request, Response } from 'express';
import * as PackageService from '../services/package.service';
import { OccasionType } from '@prisma/client';

export async function getPhotographerPackages(req: Request, res: Response): Promise<void> {
  try {
    const { photographerId } = req.params;
    const { occasionType } = req.query;

    const packages = await PackageService.getPhotographerPackages(
      photographerId,
      occasionType as OccasionType | undefined
    );

    res.json({
      success: true,
      data: packages
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function getPackageById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const pkg = await PackageService.getPackageById(id);

    res.json({
      success: true,
      data: pkg
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
}

export async function createPackage(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.user_id || (req as any).user.id;
    const { name, description, occasionType, price, deliveryDays, features, isPopular } = req.body;

    if (!name || !occasionType || price === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, occasionType, and price are required'
      });
      return;
    }

    const pkg = await PackageService.createPackage(userId, {
      name,
      description,
      occasionType: occasionType as OccasionType,
      price: Number(price),
      deliveryDays: deliveryDays ? Number(deliveryDays) : 7,
      features: Array.isArray(features) ? features : [],
      isPopular: !!isPopular
    });

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: pkg
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function updatePackage(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.user_id || (req as any).user.id;
    const { id } = req.params;
    const { name, description, occasionType, price, deliveryDays, features, isPopular } = req.body;

    const updated = await PackageService.updatePackage(userId, id, {
      name,
      description,
      occasionType: occasionType as OccasionType | undefined,
      price: price !== undefined ? Number(price) : undefined,
      deliveryDays: deliveryDays !== undefined ? Number(deliveryDays) : undefined,
      features,
      isPopular
    });

    res.json({
      success: true,
      message: 'Package updated successfully',
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

export async function deletePackage(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user.user_id || (req as any).user.id;
    const { id } = req.params;

    await PackageService.deletePackage(userId, id);

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}
