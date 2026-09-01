import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { Booking, CreateBookingData } from '../types';
import { cacheGet, cacheSet, swrFetch } from '../lib/cache';

const mapBackendToBooking = (b: any): Booking => {
  const photographerUser = b.users_bookings_photographer_idTousers || b.photographer?.users || {};
  const photographerName = photographerUser.first_name ? `${photographerUser.first_name} ${photographerUser.last_name || ''}`.trim() : (b.photographer?.name || 'Master Artisan');
  const avatar = photographerUser.profile_image_url || b.photographer?.users?.profile_image_url || null;
  const occasion = b.occasion_type ? (b.occasion_type.charAt(0) + b.occasion_type.slice(1).toLowerCase().replace('_', ' ')) : 'Portrait';

  return {
    id: b.id,
    bookingNumber: b.booking_number,
    photographerId: b.photographer_id,
    photographerName: photographerName,
    photographerImage: avatar,
    photographerAvatar: avatar,
    service: occasion,
    category: occasion,
    date: b.event_date ? new Date(b.event_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    rawDate: b.event_date,
    time: b.event_start_time ? String(b.event_start_time).slice(11, 16) || '10:00' : '10:00',
    location: b.event_location || 'Accra, Ghana',
    amount: Number(b.total_amount) || 0,
    price: Number(b.total_amount) || 0,
    depositAmount: Number(b.deposit_amount) || Math.round(Number(b.total_amount || 0) * 0.4),
    balanceAmount: Number(b.balance_amount) || Math.round(Number(b.total_amount || 0) * 0.6),
    status: (b.status ? b.status.toUpperCase() : 'PENDING') as any,
    clientName: b.users_bookings_client_idTousers ? `${b.users_bookings_client_idTousers.first_name} ${b.users_bookings_client_idTousers.last_name || ''}`.trim() : 'Client',
    depositPaid: !!b.deposit_paid,
    depositPaidAt: b.deposit_paid_at,
    fullPaymentPaid: !!b.full_payment_paid,
    clientConfirmedArrivalAt: b.client_confirmed_arrival_at,
    balancePaid: !!b.balance_paid,
    balancePaidAt: b.balance_paid_at,
    workDeliveryStatus: b.work_delivery_status || 'PENDING',
    accessPin: b.access_pin,
    deliveryUrl: b.delivery_url,
    deliveryNotes: b.delivery_notes,
    deliveryDeadlineDays: b.delivery_deadline_days || 7,
    deliveryDeadline: b.delivery_deadline,
    daysCount: b.days_count || 1,
    isMultiday: !!b.is_multiday,
    budgetOffered: b.budget_offered ? Number(b.budget_offered) : undefined,
    specialRequirements: b.special_requirements || '',
    package: b.packages || null,
    disputes: b.disputes || []
  };
};

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    return cacheGet<Booking[]>('my_bookings_list') || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return (cacheGet<Booking[]>('my_bookings_list') || []).length === 0;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setError(null);
    try {
      const fetcher = async () => {
        const res = await apiClient.get('/bookings/my-bookings');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          return res.data.data.map(mapBackendToBooking);
        }
        return [];
      };

      const data = await swrFetch<Booking[]>(
        'my_bookings_list',
        fetcher,
        (freshBookings) => {
          setBookings(freshBookings);
          setIsLoading(false);
        }
      );

      setBookings(data);
    } catch (err: any) {
      console.warn('Could not fetch bookings from API:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBooking = async (bookingData: CreateBookingData) => {
    setIsLoading(true);
    try {
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
        'graduation': 'GRADUATION'
      };

      const normalizedOccasion = occasionMap[bookingData.occasionType.toLowerCase()] || 'PORTRAIT';

      const payload = {
        photographerId: bookingData.photographerId,
        occasionType: normalizedOccasion,
        packageId: bookingData.packageId,
        eventLocation: bookingData.eventLocation || 'Greater Accra Region, Ghana',
        eventDate: bookingData.eventDate,
        eventStartTime: bookingData.eventStartTime || '14:00',
        eventEndTime: bookingData.eventEndTime,
        totalAmount: bookingData.totalAmount,
        estimatedHours: bookingData.estimatedHours || 2,
        daysCount: bookingData.daysCount || 1,
        isMultiday: bookingData.isMultiday || false,
        budgetOffered: bookingData.budgetOffered,
        specialRequirements: bookingData.specialRequirements
      };

      const res = await apiClient.post('/bookings', payload);
      if (res.data?.success && res.data?.data) {
        const newBooking = mapBackendToBooking(res.data.data);
        setBookings(prev => {
          const updated = [newBooking, ...prev];
          cacheSet('my_bookings_list', updated);
          return updated;
        });
        return newBooking;
      }
      throw new Error(res.data?.message || 'Failed to create booking');
    } catch (err: any) {
      console.error('Create booking failed:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const payDeposit = async (id: string, options: { isFullPayment?: boolean; paymentMethodId?: string; channel?: string }) => {
    try {
      const res = await apiClient.patch(`/bookings/${id}/pay-deposit`, options);
      if (res.data?.success && res.data?.data) {
        const updatedBooking = mapBackendToBooking(res.data.data);
        setBookings(prev => {
          const updated = prev.map(b => b.id === id ? updatedBooking : b);
          cacheSet('my_bookings_list', updated);
          return updated;
        });
        return updatedBooking;
      }
    } catch (err: any) {
      console.error('Pay deposit failed:', err);
      throw err;
    }
  };

  const confirmArrival = async (id: string) => {
    try {
      const res = await apiClient.patch(`/bookings/${id}/confirm-arrival`);
      if (res.data?.success && res.data?.data) {
        const updatedBooking = mapBackendToBooking(res.data.data);
        setBookings(prev => {
          const updated = prev.map(b => b.id === id ? updatedBooking : b);
          cacheSet('my_bookings_list', updated);
          return updated;
        });
        return updatedBooking;
      }
    } catch (err: any) {
      console.error('Confirm arrival failed:', err);
      throw err;
    }
  };

  const payBalance = async (id: string, options?: { paymentMethodId?: string }) => {
    try {
      const res = await apiClient.patch(`/bookings/${id}/pay-balance`, options);
      if (res.data?.success && res.data?.data) {
        const updatedBooking = mapBackendToBooking(res.data.data);
        setBookings(prev => {
          const updated = prev.map(b => b.id === id ? updatedBooking : b);
          cacheSet('my_bookings_list', updated);
          return updated;
        });
        return updatedBooking;
      }
    } catch (err: any) {
      console.error('Pay balance failed:', err);
      throw err;
    }
  };

  const updateBookingDetails = async (id: string, updateData: Partial<CreateBookingData>) => {
    try {
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
        'graduation': 'GRADUATION'
      };

      const payload: any = { ...updateData };
      if (updateData.occasionType) {
        payload.occasionType = occasionMap[updateData.occasionType.toLowerCase()] || updateData.occasionType.toUpperCase();
      }

      const res = await apiClient.patch(`/bookings/${id}/edit`, payload);
      if (res.data?.success && res.data?.data) {
        const updatedBooking = mapBackendToBooking(res.data.data);
        setBookings(prev => {
          const updated = prev.map(b => b.id === id ? updatedBooking : b);
          cacheSet('my_bookings_list', updated);
          return updated;
        });
        return updatedBooking;
      }
    } catch (err: any) {
      console.error('Update booking details failed:', err);
      throw err;
    }
  };

  const checkWorkAccess = async (id: string) => {
    try {
      const res = await apiClient.get(`/bookings/${id}/work-access`);
      if (res.data?.success) {
        return res.data.data;
      }
      return null;
    } catch (err: any) {
      console.error('Check work access failed:', err);
      throw err;
    }
  };

  const updateBudget = async (id: string, newBudget: number) => {
    try {
      const res = await apiClient.patch(`/bookings/${id}/budget`, { newBudget });
      if (res.data?.success && res.data?.data) {
        const updatedBooking = mapBackendToBooking(res.data.data);
        setBookings(prev => {
          const updated = prev.map(b => b.id === id ? updatedBooking : b);
          cacheSet('my_bookings_list', updated);
          return updated;
        });
        return updatedBooking;
      }
    } catch (err: any) {
      console.error('Update budget failed:', err);
      throw err;
    }
  };

  const createDispute = async (id: string, data: { reason: string; description: string; evidenceUrls?: string[] }) => {
    try {
      const res = await apiClient.post(`/bookings/${id}/disputes`, data);
      if (res.data?.success) {
        await fetchBookings();
        return res.data.data;
      }
    } catch (err: any) {
      console.error('Create dispute failed:', err);
      throw err;
    }
  };

  const cancelBooking = async (id: string, reason?: string) => {
    try {
      await apiClient.patch(`/bookings/${id}/cancel`, { cancellationReason: reason || 'Client requested cancellation' });
      setBookings(prev => {
        const updated = prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b);
        cacheSet('my_bookings_list', updated);
        return updated;
      });
    } catch (err: any) {
      console.error(`Error cancelling booking ${id}:`, err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    createBooking,
    updateBookingDetails,
    checkWorkAccess,
    payDeposit,
    confirmArrival,
    payBalance,
    updateBudget,
    createDispute,
    cancelBooking
  };
};

export default useBookings;
