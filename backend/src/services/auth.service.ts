/**
 * Authentication Service
 * Handles user registration, login, OAuth and password resets
 */

import crypto from 'crypto';
import prisma from '../config/database';
import * as NotificationTrigger from '../services/notification-trigger.service';
import { hashPassword, comparePassword } from '../utils/hash.utils';
import { generateToken } from '../utils/jwt.utils';
import { RegisterUserDto, LoginUserDto, AuthResponse } from '../types/user.types';

// In-memory reset tokens: email -> { token, expiresAt }
const resetTokenStore = new Map<string, { token: string; expiresAt: number }>();

/**
 * Register a new user
 */
export async function registerUser(
  userData: RegisterUserDto
): Promise<AuthResponse> {
  const existingUser = await prisma.users.findUnique({
    where: { email: userData.email }
  });
  
  if (existingUser) {
    throw new Error('Email already exists');
  }
  
  const hashedPassword = await hashPassword(userData.password);
  
  const newUser = await prisma.users.create({
    data: {
      email: userData.email,
      password_hash: hashedPassword,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone_number: userData.phone_number || null,
      user_type: userData.user_type,
      location_city: userData.location_city || null,
      location_country: userData.location_country || null,
      
      ...(userData.user_type === 'PHOTOGRAPHER' && {
        photographers: {
          create: {
            verification_status: 'PENDING',
            average_rating: 0,
            total_bookings: 0,
            subscriptions: {
              create: {
                tier: 'FREE',
                monthly_price: 0,
                commission_rate: 0.15,
                featured_listing_weight: 0,
                can_accept_advance_bookings: true,
                start_date: new Date(),
                end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                status: 'ACTIVE'
              }
            }
          }
        }
      })
    },
    include: {
      photographers: true
    }
  });
  
  const token = generateToken({
    user_id: newUser.id,
    email: newUser.email,
    user_type: newUser.user_type
  });

  if (newUser.user_type === 'CLIENT' || newUser.user_type === 'PHOTOGRAPHER') {
    NotificationTrigger.onUserRegistered({
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      userType: newUser.user_type as 'CLIENT' | 'PHOTOGRAPHER'
    }).catch(err => console.error('Notification error:', err));
  }
  
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      user_type: newUser.user_type,
      profile_image_url: newUser.profile_image_url,
      is_verified: newUser.is_verified
    },
    token
  };
}

/**
 * Login a user
 */
export async function loginUser(
  credentials: LoginUserDto
): Promise<AuthResponse> {
  const user = await prisma.users.findUnique({
    where: { email: credentials.email },
    include: {
      photographers: true
    }
  });
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isPasswordValid = await comparePassword(
    credentials.password,
    user.password_hash
  );
  
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }
  
  if (!user.is_active) {
    throw new Error('Account has been deactivated');
  }
  
  const token = generateToken({
    user_id: user.id,
    email: user.email,
    user_type: user.user_type
  });
  
  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      profile_image_url: user.profile_image_url,
      is_verified: user.is_verified
    },
    token
  };
}

/**
 * Sign In with OAuth (Google / Apple)
 */
export async function oauthLoginUser(data: {
  provider: 'google' | 'apple';
  email: string;
  firstName?: string;
  lastName?: string;
  providerId?: string;
  avatarUrl?: string;
  userType?: string;
}): Promise<AuthResponse> {
  if (!data.email) {
    throw new Error('Email is required for OAuth authentication');
  }

  let user = await prisma.users.findUnique({
    where: { email: data.email },
    include: {
      photographers: true
    }
  });

  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);
    const userRole = data.userType === 'PHOTOGRAPHER' ? 'PHOTOGRAPHER' : 'CLIENT';

    user = await prisma.users.create({
      data: {
        email: data.email,
        password_hash: hashedPassword,
        first_name: data.firstName || (data.provider === 'google' ? 'Google' : 'Apple'),
        last_name: data.lastName || (userRole === 'PHOTOGRAPHER' ? 'Creator' : 'User'),
        profile_image_url: data.avatarUrl || null,
        user_type: userRole,
        is_verified: true,
        email_verified_at: new Date()
      },
      include: {
        photographers: true
      }
    });

    if (userRole === 'PHOTOGRAPHER') {
      const photographer = await prisma.photographers.create({
        data: {
          user_id: user.id,
          hourly_rate: 350,
          day_rate: 2500,
          bio: 'Master visual artist crafting timeless Ghanaian imagery.',
          verification_status: 'VERIFIED',
          services: ['PORTRAIT', 'WEDDING'],
          equipment_list: ['Sony A7IV', '24-70mm f/2.8 GM', '85mm f/1.4']
        }
      });

      await prisma.subscriptions.create({
        data: {
          photographer_id: photographer.id,
          tier: 'PRO',
          monthly_price: 150,
          commission_rate: 0.05,
          status: 'ACTIVE',
          start_date: new Date(),
          end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)
        }
      });
    }

    NotificationTrigger.onUserRegistered({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      userType: userRole
    }).catch(err => console.error('OAuth registration notification error:', err));
  } else if (!user.is_active) {
    throw new Error('Account has been deactivated');
  } else if (data.userType === 'PHOTOGRAPHER' || user.user_type === 'PHOTOGRAPHER') {
    const existingPhotographer = await prisma.photographers.findUnique({
      where: { user_id: user.id }
    });
    if (!existingPhotographer) {
      const photographer = await prisma.photographers.create({
        data: {
          user_id: user.id,
          hourly_rate: 350,
          day_rate: 2500,
          bio: 'Master visual artist crafting timeless Ghanaian imagery.',
          verification_status: 'VERIFIED',
          services: ['PORTRAIT', 'WEDDING'],
          equipment_list: ['Sony A7IV', '24-70mm f/2.8 GM', '85mm f/1.4']
        }
      });
      await prisma.subscriptions.create({
        data: {
          photographer_id: photographer.id,
          tier: 'PRO',
          monthly_price: 150,
          commission_rate: 0.05,
          status: 'ACTIVE',
          start_date: new Date(),
          end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)
        }
      });
    }
  }

  const token = generateToken({
    user_id: user.id,
    email: user.email,
    user_type: user.user_type
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      profile_image_url: user.profile_image_url,
      is_verified: user.is_verified
    },
    token
  };
}

/**
 * Request Password Reset Token
 */
export async function requestPasswordReset(email: string): Promise<{ resetToken: string; email: string }> {
  const user = await prisma.users.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('No account registered with this email address');
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour

  resetTokenStore.set(email.toLowerCase(), { token: resetToken, expiresAt });

  return {
    resetToken,
    email: user.email
  };
}

/**
 * Reset Password with Token
 */
export async function executePasswordReset(data: {
  email: string;
  resetToken: string;
  newPassword: string;
}): Promise<void> {
  const normalizedEmail = data.email.toLowerCase();
  const entry = resetTokenStore.get(normalizedEmail);

  if (!entry || entry.token !== data.resetToken) {
    throw new Error('Invalid or expired password reset token');
  }

  if (Date.now() > entry.expiresAt) {
    resetTokenStore.delete(normalizedEmail);
    throw new Error('Password reset token has expired. Please request a new one.');
  }

  if (!data.newPassword || data.newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }

  const user = await prisma.users.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const newHashedPassword = await hashPassword(data.newPassword);

  await prisma.users.update({
    where: { id: user.id },
    data: {
      password_hash: newHashedPassword,
      updated_at: new Date()
    }
  });

  // Consume the reset token
  resetTokenStore.delete(normalizedEmail);
}