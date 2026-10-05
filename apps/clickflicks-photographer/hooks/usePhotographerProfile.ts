import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../lib/api-client';
import { useAuth, PhotographerProfile } from './useAuth';
import { cacheGet, cacheSet, swrFetch } from '../lib/cache';

export const usePhotographerProfile = () => {
  const { photographerProfile, updatePhotographerProfile, user, updateUser } = useAuth();
  const [profile, setProfile] = useState<PhotographerProfile | null>(() => {
    return photographerProfile || cacheGet<PhotographerProfile>('photographer_profile_data');
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !photographerProfile && !cacheGet<PhotographerProfile>('photographer_profile_data');
  });
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);
    try {
      const fetcher = async () => {
        const res = await apiClient.get('/photographers/me');
        if (res.data?.success && res.data?.data) {
          return res.data.data;
        }
        return null;
      };

      const data = await swrFetch<PhotographerProfile | null>(
        'photographer_profile_data',
        fetcher,
        (freshProfile) => {
          if (freshProfile) {
            setProfile(freshProfile);
            updatePhotographerProfile(freshProfile);
            if (freshProfile.users) {
              updateUser(freshProfile.users);
            }
          }
        }
      );

      if (data) {
        setProfile(data);
        updatePhotographerProfile(data);
        if (data.users) {
          updateUser(data.users);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch photographer profile online:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [updatePhotographerProfile, updateUser]);

  const updateProfile = async (data: {
    bio?: string;
    services?: string[];
    equipmentList?: string[];
    yearsExperience?: number;
    hourlyRate?: number;
    dayRate?: number;
    portfolioWebsite?: string;
    instagramHandle?: string;
    service_area?: string;
    serviceArea?: string;
    region?: string;
    business_name?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await apiClient.patch('/photographers/profile', data);
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
        cacheSet('photographer_profile_data', res.data.data);
        updatePhotographerProfile(res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.error('Failed to update photographer profile online:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: {
    profileImageUrl?: string;
    locationCity?: string;
    locationCountry?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await apiClient.patch('/users/me', data);
      if (res.data?.success && res.data?.data) {
        updateUser(res.data.data);
        setProfile(prev => prev ? { ...prev, users: { ...(prev as any).users, ...res.data.data } } : prev);
        return res.data.data;
      }
    } catch (err: any) {
      console.error('Failed to update user profile:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addPortfolio = async (item: {
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    occasionType?: string;
    isFeatured?: boolean;
  }) => {
    try {
      const res = await apiClient.post('/photographers/portfolio', {
        title: item.title,
        description: item.description,
        image_url: item.imageUrl,
        thumbnail_url: item.thumbnailUrl || item.imageUrl,
        occasion_type: item.occasionType || 'PORTRAIT',
        is_featured: item.isFeatured || false
      });
      if (res.data?.success && res.data?.data) {
        await fetchProfile();
        return res.data.data;
      }
    } catch (err: any) {
      console.error('Failed to save portfolio to API:', err.message);
      throw err;
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      await apiClient.delete(`/photographers/portfolio/${id}`);
      await fetchProfile();
    } catch (err: any) {
      console.error('Failed to delete portfolio online:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (photographerProfile) {
      setProfile(photographerProfile);
    }
  }, [photographerProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    user,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updateUserProfile,
    updateUser,
    addPortfolio,
    deletePortfolio
  };
};

export default usePhotographerProfile;
