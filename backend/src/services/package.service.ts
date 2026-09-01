/**
 * Package Service
 * Business logic for photographer packages
 */

import prisma from '../config/database';
import { OccasionType } from '@prisma/client';

export interface CreatePackageData {
  name: string;
  description?: string;
  occasionType: OccasionType;
  price: number;
  deliveryDays?: number;
  features?: string[];
  isPopular?: boolean;
}

export interface UpdatePackageData {
  name?: string;
  description?: string;
  occasionType?: OccasionType;
  price?: number;
  deliveryDays?: number;
  features?: string[];
  isPopular?: boolean;
}

/**
 * Get all packages for a photographer
 */
export async function getPhotographerPackages(photographerIdOrUserId: string, occasionType?: OccasionType) {
  // Can be passed either photographers.id or users.id
  let photog = await prisma.photographers.findUnique({
    where: { id: photographerIdOrUserId }
  });

  if (!photog) {
    photog = await prisma.photographers.findUnique({
      where: { user_id: photographerIdOrUserId }
    });
  }

  if (!photog) {
    return [];
  }

  const where: any = {
    photographer_id: photog.id
  };

  if (occasionType) {
    where.occasion_type = occasionType;
  }

  const packages = await prisma.packages.findMany({
    where,
    orderBy: [
      { is_popular: 'desc' },
      { price: 'asc' }
    ]
  });

  return packages;
}

/**
 * Get single package by ID
 */
export async function getPackageById(packageId: string) {
  const pkg = await prisma.packages.findUnique({
    where: { id: packageId },
    include: {
      photographers: {
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              profile_image_url: true
            }
          }
        }
      }
    }
  });

  if (!pkg) {
    throw new Error('Package not found');
  }

  return pkg;
}

/**
 * Create package for photographer
 */
export async function createPackage(userId: string, data: CreatePackageData) {
  const photog = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });

  if (!photog) {
    throw new Error('Photographer profile not found');
  }

  const pkg = await prisma.packages.create({
    data: {
      photographer_id: photog.id,
      name: data.name,
      description: data.description,
      occasion_type: data.occasionType,
      price: data.price,
      delivery_days: data.deliveryDays || 7,
      features: data.features || [],
      is_popular: data.isPopular || false
    }
  });

  return pkg;
}

/**
 * Update package
 */
export async function updatePackage(userId: string, packageId: string, data: UpdatePackageData) {
  const photog = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });

  if (!photog) {
    throw new Error('Photographer profile not found');
  }

  const existing = await prisma.packages.findUnique({
    where: { id: packageId }
  });

  if (!existing || existing.photographer_id !== photog.id) {
    throw new Error('Package not found or unauthorized');
  }

  const updated = await prisma.packages.update({
    where: { id: packageId },
    data: {
      name: data.name !== undefined ? data.name : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      occasion_type: data.occasionType !== undefined ? data.occasionType : existing.occasion_type,
      price: data.price !== undefined ? data.price : existing.price,
      delivery_days: data.deliveryDays !== undefined ? data.deliveryDays : existing.delivery_days,
      features: data.features !== undefined ? data.features : (existing.features as any),
      is_popular: data.isPopular !== undefined ? data.isPopular : existing.is_popular
    }
  });

  return updated;
}

/**
 * Delete package
 */
export async function deletePackage(userId: string, packageId: string) {
  const photog = await prisma.photographers.findUnique({
    where: { user_id: userId }
  });

  if (!photog) {
    throw new Error('Photographer profile not found');
  }

  const existing = await prisma.packages.findUnique({
    where: { id: packageId }
  });

  if (!existing || existing.photographer_id !== photog.id) {
    throw new Error('Package not found or unauthorized');
  }

  await prisma.packages.delete({
    where: { id: packageId }
  });

  return { success: true, message: 'Package deleted successfully' };
}
