import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api-client';
import { Booking } from '../types';
import { cacheGet, cacheSet, swrFetch } from '../lib/cache';

const mapBackendToBooking = (b: any): Booking => {
  const clientUser = b.users_bookings_client_idTousers || b.client || {};
  const clientName = clientUser.first_name ? `${clientUser.first_name} ${clientUser.last_name || ''}`.trim() : 'Private Client';

  return {
    id: b.id,
    bookingNumber: b.booking_number,
    photographerId: b.photographer_id,
    photographerName: 'My Studio',
    photographerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    clientId: b.client_id,
    clientName: clientName,
    clientAvatar: clientUser.profile_image_url || null,
    clientPhone: clientUser.phone_number || null,
    service: b.packages?.name || (b.occasion_type ? b.occasion_type.replace('_', ' ') : 'Portrait Session'),
    category: b.occasion_type ? b.occasion_type.replace('_', ' ') : 'Portrait',
    date: b.event_date ? new Date(b.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming',
    rawDate: b.event_date ? new Date(b.event_date).toISOString().split('T')[0] : '',
    time: b.event_start_time ? String(b.event_start_time).slice(11, 16) || String(b.event_start_time).slice(0, 5) : '10:00',
    location: b.event_location || 'Accra, Ghana',
    price: Number(b.total_amount) || 0,
    amount: Number(b.total_amount) || 0,
    depositAmount: Number(b.deposit_amount) || Math.round(Number(b.total_amount || 0) * 0.4),
    balanceAmount: Number(b.balance_amount) || Math.round(Number(b.total_amount || 0) * 0.6),
    status: (b.status ? b.status.toLowerCase() : 'pending') as any,
    estimatedHours: Number(b.estimated_hours) || 2,
    daysCount: Number(b.days_count) || 1,
    isMultiday: !!b.is_multiday,
    specialRequirements: b.special_requirements || '',
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
    deliveryDeadlineDays: Number(b.delivery_deadline_days) || 7,
    deliveryDeadline: b.delivery_deadline,
    package: b.packages || null,
    disputes: b.disputes || []
  };
};

export const usePhotographerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    return cacheGet<Booking[]>('photographer_bookings_list') || [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return (cacheGet<Booking[]>('photographer_bookings_list') || []).length === 0;
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
        'photographer_bookings_list',
        fetcher,
        (freshBookings) => {
          setBookings(freshBookings);
          setIsLoading(false);
        }
      );

      setBookings(data);
    } catch (err: any) {
      console.warn('Could not fetch photographer bookings from API:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptBooking = async (id: string, deliveryDeadlineDays?: number) => {
    try {
      // Optimistic update
      setBookings(prev => {
        const updated = prev.map(b => b.id === id ? { ...b, status: 'accepted' as any, deliveryDeadlineDays: deliveryDeadlineDays || 7 } : b);
        cacheSet('photographer_bookings_list', updated);
        return updated;
      });

      await apiClient.patch(`/bookings/${id}/accept`, { deliveryDeadlineDays });
      await fetchBookings();
    } catch (err: any) {
      console.error(`Accept failed for booking ${id}:`, err);
      throw err;
    }
  };

  const rejectBooking = async (id: string, reason?: string) => {
    try {
      // Optimistic update
      setBookings(prev => {
        const updated = prev.map(b => b.id === id ? { ...b, status: 'rejected' as any } : b);
        cacheSet('photographer_bookings_list', updated);
        return updated;
      });

      await apiClient.patch(`/bookings/${id}/reject`, { reason: reason || 'Photographer unavailable' });
      await fetchBookings();
    } catch (err: any) {
      console.error(`Reject failed for booking ${id}:`, err);
      throw err;
    }
  };

  const deliverWork = async (id: string, data: { deliveryUrl: string; accessPin?: string; deliveryNotes?: string }) => {
    try {
      await apiClient.patch(`/bookings/${id}/deliver-work`, data);
      await fetchBookings();
    } catch (err) {
      console.error(`Deliver work failed for booking ${id}:`, err);
      throw err;
    }
  };

  const startShoot = async (id: string) => {
    try {
      await apiClient.patch(`/bookings/${id}/start`);
      await fetchBookings();
    } catch (err) {
      console.warn(`Start shoot failed for booking ${id}`);
    }
  };

  const completeShoot = async (id: string) => {
    try {
      await apiClient.patch(`/bookings/${id}/complete`);
      await fetchBookings();
    } catch (err) {
      console.warn(`Complete shoot failed for booking ${id}`);
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
    acceptBooking,
    rejectBooking,
    deliverWork,
    startShoot,
    completeShoot
  };
};

export default usePhotographerBookings;
