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

export interface Photographer {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  imageUrl: string;
  verified: boolean;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  portfolio: string[];
  about: string;
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
  photographerId: string;
  photographerName: string;
  photographerImage: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  amount: number;
  category: string;
}

export interface CreateBookingData {
  clientId: string;
  photographerId: string;
  occasionType: OccasionType;
  eventLocation: string;
  eventLatitude?: number;
  eventLongitude?: number;
  eventDate: Date;
  eventStartTime: string;  // "09:00"
  eventEndTime?: string;   // "17:00"
  estimatedHours?: number;
  totalAmount: number;
  specialRequirements?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantImage: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
}