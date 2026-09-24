import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { Photographer } from '../types';
import { cacheGet, swrFetch } from '../lib/cache';

export interface PhotographerFilters {
  locationCity?: string;
  occasionType?: string;
  minRating?: number;
  maxHourlyRate?: number;
  verifiedOnly?: boolean;
  search?: string;
}

const mapCategoryToBackendEnum = (category?: string): string | undefined => {
  if (!category || category === 'All') return undefined;
  const lower = category.toLowerCase();
  if (lower.includes('wedding')) return 'WEDDING';
  if (lower.includes('portrait')) return 'PORTRAIT';
  if (lower.includes('corp')) return 'CORPORATE_EVENT';
  if (lower.includes('event')) return 'CORPORATE_EVENT';
  if (lower.includes('product') || lower.includes('comm')) return 'PRODUCT_SHOOT';
  if (lower.includes('family')) return 'FAMILY_SHOOT';
  if (lower.includes('real')) return 'REAL_ESTATE';
  if (lower.includes('sport')) return 'SPORTS';
  if (lower.includes('grad')) return 'GRADUATION';
  if (lower.includes('mobile')) return 'MOBILE_PHOTOGRAPHY';
  if (lower.includes('journal') || lower.includes('press')) return 'PHOTOJOURNALISM';
  if (lower.includes('video') || lower.includes('film')) return 'VIDEOGRAPHY';
  return undefined;
};

export const mapBackendToPhotographer = (item: any): Photographer => {
  const user = item.users || {};
  const portfolio = (item.portfolio_items || []).map((p: any) => p.image_url || p.url || p.thumbnail_url).filter(Boolean);
  const featuredImage = portfolio[0] || user.profile_image_url || null;
  const rawPackages = Array.isArray(item.packages) ? item.packages : [];
  const packagePrices = rawPackages
    .map((p: any) => Number(p.price))
    .filter((n: number) => !isNaN(n) && n > 0);
  const minPackagePrice = packagePrices.length > 0 ? Math.min(...packagePrices) : null;

  const rawHourly = item.hourly_rate != null && !isNaN(Number(item.hourly_rate)) && Number(item.hourly_rate) > 0 ? Number(item.hourly_rate) : null;
  const dayRate = item.day_rate != null && !isNaN(Number(item.day_rate)) && Number(item.day_rate) > 0 ? Number(item.day_rate) : null;
  const hourly = rawHourly || minPackagePrice || null;
  const startingPrice = minPackagePrice || hourly || dayRate || null;

  const rawServices = Array.isArray(item.services) ? item.services : [];
  const primaryCategory = rawServices.length > 0 
    ? (rawServices[0].charAt(0) + rawServices[0].slice(1).toLowerCase().replace('_', ' ')) 
    : 'Portrait';

  const bioText = item.bio || '';
  const avgRating = item.average_rating != null && !isNaN(Number(item.average_rating)) ? Number(item.average_rating) : 0;
  const totalBookings = item.total_bookings != null && !isNaN(Number(item.total_bookings)) ? Number(item.total_bookings) : 0;

  const isVerified = item.verification_status === 'VERIFIED' || item.is_verified === true || user.is_verified === true || (item.verification_status !== 'UNVERIFIED' && item.verification_status !== 'REJECTED');

  return {
    id: item.id,
    name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (item.name || 'Artisan Photographer'),
    title: bioText ? (bioText.slice(0, 45) + (bioText.length > 45 ? '...' : '')) : '',
    category: primaryCategory,
    rating: avgRating,
    reviewCount: totalBookings,
    reviewsCount: totalBookings,
    hourlyRate: hourly,
    startingPrice: startingPrice,
    dayRate: dayRate,
    priceUnit: 'hr',
    location: user.location_city ? `${user.location_city}, ${user.location_country || 'Ghana'}` : (user.location_country || 'Ghana'),
    imageUrl: featuredImage,
    coverImage: featuredImage,
    avatar: user.profile_image_url || null,
    verified: isVerified,
    featured: !!item.is_featured,
    tier: (item.subscriptions?.tier || 'FREE') as any,
    about: bioText || null,
    bio: bioText || null,
    tags: rawServices.length > 0 ? rawServices.map((s: string) => s.replace('_', ' ')) : [],
    services: rawServices,
    portfolio: portfolio,
    gear: Array.isArray(item.equipment_list) && item.equipment_list.length > 0 ? item.equipment_list : [],
    packages: rawPackages
  };
};

export const usePhotographers = (initialCategory?: string) => {
  const cacheKey = `photographers_${initialCategory || 'all'}`;
  
  const [photographers, setPhotographers] = useState<Photographer[]>(() => {
    const cached = cacheGet<Photographer[]>(cacheKey);
    return cached || [];
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return (cacheGet<Photographer[]>(cacheKey) || []).length === 0;
  });
  
  const [error, setError] = useState<string | null>(null);

  const fetchPhotographers = useCallback(async (filters?: PhotographerFilters) => {
    setError(null);
    const key = `photographers_${filters?.occasionType || initialCategory || 'all'}`;

    try {
      const fetcher = async () => {
        const params: any = {};
        const occasion = filters?.occasionType || mapCategoryToBackendEnum(initialCategory);
        if (occasion) params.occasionType = occasion;
        if (filters?.locationCity) params.locationCity = filters.locationCity;
        if (filters?.minRating) params.minRating = filters.minRating;
        if (filters?.maxHourlyRate) params.maxHourlyRate = filters.maxHourlyRate;
        if (filters?.verifiedOnly) params.verifiedOnly = true;

        const res = await apiClient.get('/photographers/search', { params });
        if (res.data?.success && Array.isArray(res.data?.data)) {
          let list = res.data.data.map(mapBackendToPhotographer);
          if (filters?.search) {
            const query = filters.search.toLowerCase();
            list = list.filter((p: Photographer) => 
              p.name.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) ||
              p.location.toLowerCase().includes(query)
            );
          }
          return list;
        }
        return [];
      };

      const data = await swrFetch<Photographer[]>(
        key,
        fetcher,
        (freshData) => {
          setPhotographers(freshData);
          setIsLoading(false);
        }
      );

      setPhotographers(data);
    } catch (err: any) {
      console.warn('API Search Photographers failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [initialCategory]);

  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  const getPhotographerById = useCallback(async (id: string): Promise<Photographer | null> => {
    const singleCacheKey = `photographer_${id}`;
    const cached = cacheGet<Photographer>(singleCacheKey);
    if (cached) return cached;

    try {
      const res = await apiClient.get(`/photographers/${id}`);
      if (res.data?.success && res.data?.data) {
        const item = mapBackendToPhotographer(res.data.data);
        return item;
      }
    } catch (err) {
      console.error(`Error fetching photographer ${id}:`, err);
    }
    return null;
  }, []);

  return {
    photographers,
    isLoading,
    error,
    refetch: fetchPhotographers,
    getPhotographerById
  };
};

export default usePhotographers;
