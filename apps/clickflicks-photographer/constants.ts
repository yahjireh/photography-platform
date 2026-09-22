import { Photographer, Category, Booking, Conversation, ChatMessage, Review } from './types';

export const CATEGORIES: Category[] = [
  { id: 'wedding', name: 'Wedding', icon: 'Heart', image: 'https://picsum.photos/seed/wedding/400/300' },
  { id: 'corporate', name: 'Corporate', icon: 'Briefcase', image: 'https://picsum.photos/seed/corp/400/300' },
  { id: 'fashion', name: 'Fashion', icon: 'Shirt', image: 'https://picsum.photos/seed/fashion/400/300' },
  { id: 'portrait', name: 'Portrait', icon: 'User', image: 'https://picsum.photos/seed/portrait/400/300' },
  { id: 'events', name: 'Events', icon: 'Calendar', image: 'https://picsum.photos/seed/event/400/300' },
  { id: 'product', name: 'Product', icon: 'Package', image: 'https://picsum.photos/seed/product/400/300' },
  { id: 'mobile', name: 'Mobile Photography', icon: 'Smartphone', image: 'https://picsum.photos/seed/mobile/400/300' },
  { id: 'photojournalism', name: 'Photojournalism', icon: 'Newspaper', image: 'https://picsum.photos/seed/journalism/400/300' },
  { id: 'videography', name: 'Videography', icon: 'Video', image: 'https://picsum.photos/seed/video/400/300' },
];

export const MOCK_PHOTOGRAPHERS: Photographer[] = [
  {
    id: '1',
    name: 'Kojo Antwi',
    category: 'Wedding',
    rating: 4.9,
    reviewCount: 124,
    hourlyRate: 350,
    location: 'Accra, Greater Accra',
    imageUrl: 'https://picsum.photos/seed/kojo/200/200',
    verified: true,
    tier: 'ENTERPRISE',
    about: 'Award-winning wedding photographer capturing timeless moments across Ghana. Specialized in traditional and white weddings.',
    portfolio: [
      'https://picsum.photos/seed/w1/400/600',
      'https://picsum.photos/seed/w2/400/600',
      'https://picsum.photos/seed/w3/400/600',
      'https://picsum.photos/seed/w4/400/600',
    ]
  },
  {
    id: '2',
    name: 'Ama Serwaa',
    category: 'Fashion',
    rating: 4.8,
    reviewCount: 89,
    hourlyRate: 250,
    location: 'Osu, Accra',
    imageUrl: 'https://picsum.photos/seed/ama/200/200',
    verified: true,
    tier: 'PRO',
    about: 'Editorial and high-fashion photographer with a unique eye for style and composition.',
    portfolio: [
      'https://picsum.photos/seed/f1/400/600',
      'https://picsum.photos/seed/f2/400/600',
      'https://picsum.photos/seed/f3/400/600',
    ]
  },
  {
    id: '3',
    name: 'Kwame Mensah',
    category: 'Corporate',
    rating: 4.7,
    reviewCount: 56,
    hourlyRate: 400,
    location: 'Kumasi, Ashanti',
    imageUrl: 'https://picsum.photos/seed/kwame/200/200',
    verified: true,
    tier: 'PRO',
    about: 'Professional corporate headshots and event coverage. Reliable and fast delivery.',
    portfolio: [
      'https://picsum.photos/seed/c1/400/600',
      'https://picsum.photos/seed/c2/400/600',
    ]
  },
  {
    id: '4',
    name: 'Esi Doe',
    category: 'Portrait',
    rating: 4.6,
    reviewCount: 32,
    hourlyRate: 150,
    location: 'East Legon, Accra',
    imageUrl: 'https://picsum.photos/seed/esi/200/200',
    verified: false,
    tier: 'FREE',
    about: 'Natural light portrait specialist. Great for family photos and personal branding.',
    portfolio: [
      'https://picsum.photos/seed/p1/400/600',
      'https://picsum.photos/seed/p2/400/600',
    ]
  },
  {
    id: '5',
    name: 'Yaw Boateng',
    category: 'Events',
    rating: 4.9,
    reviewCount: 210,
    hourlyRate: 300,
    location: 'Tema, Greater Accra',
    imageUrl: 'https://picsum.photos/seed/yaw/200/200',
    verified: true,
    tier: 'ENTERPRISE',
    about: 'Capturing the energy of your events. Concerts, parties, and festivals.',
    portfolio: [
      'https://picsum.photos/seed/e1/400/600',
      'https://picsum.photos/seed/e2/400/600',
    ]
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    photographerId: '1',
    userName: 'Akosua Mensah',
    userImage: 'https://picsum.photos/seed/user1/100/100',
    rating: 5,
    comment: 'Absolutely stunning work! Kojo captured every emotion of our wedding day perfectly. Highly recommend.',
    timestamp: '2 weeks ago'
  },
  {
    id: 'r2',
    photographerId: '1',
    userName: 'David Tetteh',
    userImage: 'https://picsum.photos/seed/user2/100/100',
    rating: 4,
    comment: 'Great professional service. The photos are top-notch, though delivery took a bit longer than expected.',
    timestamp: '1 month ago'
  },
  {
    id: 'r3',
    photographerId: '2',
    userName: 'Evelyn Owusu',
    userImage: 'https://picsum.photos/seed/user3/100/100',
    rating: 5,
    comment: 'Ama has an incredible eye for fashion. The editorial shoot was beyond my expectations.',
    timestamp: '3 weeks ago'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-2026-001',
    photographerId: '1',
    photographerName: 'Kojo Antwi',
    photographerImage: 'https://picsum.photos/seed/kojo/200/200',
    date: '2026-02-14',
    status: 'CONFIRMED',
    amount: 2500,
    category: 'Wedding'
  },
  {
    id: 'BK-2025-098',
    photographerId: '3',
    photographerName: 'Kwame Mensah',
    photographerImage: 'https://picsum.photos/seed/kwame/200/200',
    date: '2025-12-20',
    status: 'COMPLETED',
    amount: 1200,
    category: 'Corporate'
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participantId: '1',
    participantName: 'Kojo Antwi',
    participantImage: 'https://picsum.photos/seed/kojo/200/200',
    lastMessage: 'The wedding gallery is almost ready!',
    unreadCount: 2,
    timestamp: '10:45 AM'
  },
  {
    id: 'c2',
    participantId: '2',
    participantName: 'Ama Serwaa',
    participantImage: 'https://picsum.photos/seed/ama/200/200',
    lastMessage: 'Can we reschedule the fashion shoot?',
    unreadCount: 0,
    timestamp: 'Yesterday'
  }
];

export const MOCK_CHAT_HISTORY: Record<string, ChatMessage[]> = {
  'c1': [
    { id: 'm1', role: 'model', text: 'Hello! Thanks for booking with me.', timestamp: Date.now() - 86400000 },
    { id: 'm2', role: 'user', text: 'Hi Kojo, I am excited about the wedding photos.', timestamp: Date.now() - 82400000 },
    { id: 'm3', role: 'model', text: 'The wedding gallery is almost ready!', timestamp: Date.now() - 3600000 },
  ],
  'c2': [
    { id: 'm4', role: 'user', text: 'Hi Ama, is our shoot still on?', timestamp: Date.now() - 172800000 },
    { id: 'm5', role: 'model', text: 'Can we reschedule the fashion shoot?', timestamp: Date.now() - 86400000 },
  ]
};
