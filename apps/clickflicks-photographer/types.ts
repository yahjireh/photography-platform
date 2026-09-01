export enum UserType {
  CLIENT = 'CLIENT',
  PHOTOGRAPHER = 'PHOTOGRAPHER'
}

export enum OccasionType {
  WEDDING = 'Wedding',
  CORPORATE = 'Corporate',
  FASHION = 'Fashion',
  PORTRAIT = 'Portrait',
  EVENT = 'Event',
  PRODUCT = 'Product'
}

export interface PhotographerPackage {
  id: string;
  photographer_id: string;
  name: string;
  description?: string | null;
  occasion_type: string;
  price: number;
  delivery_days: number;
  features: string[];
  is_popular?: boolean;
}

export interface Photographer {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  dayRate?: number;
  location: string;
  imageUrl: string;
  verified: boolean;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  portfolio: string[];
  about: string;
  packages?: PhotographerPackage[];
}

export interface Review {
  id: string;
  photographerId: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  bookingNumber?: string;
  photographerId: string;
  photographerName: string;
  photographerAvatar?: string | null;
  photographerImage?: string | null;
  clientId?: string;
  clientName: string;
  clientAvatar?: string | null;
  clientPhone?: string | null;
  service: string;
  category?: string;
  date: string;
  rawDate?: string;
  time: string;
  location: string;
  price: number;
  amount?: number;
  depositAmount?: number;
  balanceAmount?: number;
  status: 'pending' | 'accepted' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected' | 'disputed' | 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | string;
  estimatedHours?: number;
  daysCount?: number;
  isMultiday?: boolean;
  specialRequirements?: string;
  depositPaid?: boolean;
  depositPaidAt?: string | null;
  fullPaymentPaid?: boolean;
  clientConfirmedArrivalAt?: string | null;
  balancePaid?: boolean;
  balancePaidAt?: string | null;
  workDeliveryStatus?: string | null;
  accessPin?: string | null;
  deliveryUrl?: string | null;
  deliveryNotes?: string | null;
  deliveryDeadlineDays?: number;
  deliveryDeadline?: string | null;
  package?: PhotographerPackage | null;
  disputes?: any[];
}

export interface ChatMessage {
  id: string;
  sender: 'photographer' | 'user' | 'client';
  text: string;
  time?: string;
  timestamp?: number;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

export interface Conversation {
  id: string;
  photographerId: string;
  photographerName: string;
  photographerAvatar?: string | null;
  participantId?: string;
  participantName?: string;
  participantImage?: string;
  lastMessage: string;
  lastMessageTime?: string;
  unreadCount: number;
  timestamp?: string;
  online?: boolean;
  bookingDetails?: {
    service: string;
    date: string;
    status: string;
  };
}
