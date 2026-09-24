export enum UserType {
  CLIENT = 'CLIENT',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  ADMIN = 'ADMIN'
}

export enum OccasionType {
  PORTRAIT = 'Portrait',
  WEDDING = 'Wedding',
  CORPORATE = 'Corporate',
  FASHION = 'Fashion',
  EVENT = 'Event',
  PRODUCT = 'Product',
  MOBILE_PHOTOGRAPHY = 'Mobile Photography',
  PHOTOJOURNALISM = 'Photojournalism',
  VIDEOGRAPHY = 'Videography'
}

export interface PricingPackage {
  name: string;
  price: number;
  duration: string;
  deliverables: string[];
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
  title?: string;
  category: string;
  rating: number;
  reviewCount: number;
  reviewsCount?: number;
  hourlyRate?: number | null;
  startingPrice?: number | null;
  dayRate?: number | null;
  priceUnit?: string;
  location: string;
  imageUrl?: string | null;
  coverImage?: string | null;
  avatar?: string | null;
  verified: boolean;
  featured?: boolean;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  portfolio: string[];
  about?: string | null;
  bio?: string | null;
  tags: string[];
  services?: string[];
  gear?: string[];
  pricingPackages?: PricingPackage[];
  packages?: PhotographerPackage[];
}

export interface Review {
  id: string;
  photographerId?: string;
  userName: string;
  userImage?: string | null;
  userAvatar?: string | null;
  rating: number;
  comment: string;
  timestamp: string;
  date?: string;
}

export interface Booking {
  id: string;
  bookingNumber?: string;
  photographerId: string;
  photographerName: string;
  photographerImage?: string | null;
  photographerAvatar?: string | null;
  date: string;
  rawDate?: string;
  time?: string;
  location?: string;
  status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'DISPUTED' | string;
  amount: number;
  price?: number;
  depositAmount?: number;
  balanceAmount?: number;
  category: string;
  service?: string;
  clientName?: string;
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
  daysCount?: number;
  isMultiday?: boolean;
  budgetOffered?: number;
  specialRequirements?: string;
  package?: PhotographerPackage | null;
  disputes?: any[];
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export interface CreateBookingData {
  clientId?: string;
  photographerId: string;
  occasionType: string;
  packageId?: string;
  eventLocation: string;
  eventLatitude?: number;
  eventLongitude?: number;
  eventDate: string | Date;
  eventStartTime: string;
  eventEndTime?: string;
  estimatedHours?: number;
  daysCount?: number;
  isMultiday?: boolean;
  budgetOffered?: number;
  totalAmount: number;
  specialRequirements?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  avatar?: string;
  walletBalance?: number;
  phone?: string;
  location?: string;
  savedPhotographers?: string[];
}
