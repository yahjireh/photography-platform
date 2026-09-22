import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { PhotographerPackage } from '../types';

export const usePackages = (photographerId?: string, occasionType?: string) => {
  const [packages, setPackages] = useState<PhotographerPackage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    if (!photographerId) {
      setPackages([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let url = `/packages/photographer/${photographerId}`;
      if (occasionType) {
        const occasionMap: Record<string, string> = {
          'portrait': 'PORTRAIT',
          'wedding': 'WEDDING',
          'fashion': 'PORTRAIT',
          'events': 'CORPORATE_EVENT',
          'event': 'CORPORATE_EVENT',
          'corporate': 'CORPORATE_EVENT',
          'corporate_event': 'CORPORATE_EVENT',
          'product': 'PRODUCT_SHOOT',
          'product_shoot': 'PRODUCT_SHOOT',
          'commercial': 'PRODUCT_SHOOT',
          'birthday': 'BIRTHDAY',
          'conference': 'CONFERENCE',
          'family': 'FAMILY_SHOOT',
          'real_estate': 'REAL_ESTATE',
          'sports': 'SPORTS',
          'graduation': 'GRADUATION',
          'mobile': 'MOBILE_PHOTOGRAPHY',
          'mobile_photography': 'MOBILE_PHOTOGRAPHY',
          'photojournalism': 'PHOTOJOURNALISM',
          'photojournalist': 'PHOTOJOURNALISM',
          'videography': 'VIDEOGRAPHY',
          'videographer': 'VIDEOGRAPHY',
          'video': 'VIDEOGRAPHY'
        };
        const norm = occasionMap[occasionType.toLowerCase()] || occasionType.toUpperCase();
        url += `?occasionType=${norm}`;
      }

      const res = await apiClient.get(url);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setPackages(res.data.data);
      } else {
        setPackages([]);
      }
    } catch (err: any) {
      console.warn('Could not fetch packages:', err.message);
      setError(err.message || 'Failed to fetch packages');
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, [photographerId, occasionType]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return {
    packages,
    isLoading,
    error,
    refetch: fetchPackages
  };
};

export default usePackages;
