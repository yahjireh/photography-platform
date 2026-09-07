import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import PhotographerDetail from './pages/PhotographerDetail';
import Bookings from './pages/Bookings';
import Messages from './pages/Messages';
import ChatDetail, { ChatPartnerInfo } from './pages/ChatDetail';
import Profile from './pages/Profile';
import AIConcierge from './pages/AIConcierge';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BottomNav from './components/BottomNav';
import ApertureTransition from './components/ApertureTransition';
import AppTourModal from './components/AppTourModal';
import { Photographer, Booking } from './types';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useMessages } from './hooks/useMessages';
import { usePhotographers } from './hooks/usePhotographers';
import { AperturePulseLoader } from './components/SkeletonLoader';
import apiClient from './lib/api-client';
import { cacheGet, cacheSet } from './lib/cache';
import { MobileConfigService } from './services/MobileConfigService';

type AppState = 'ONBOARDING' | 'AUTH' | 'MAIN';
type AuthState = 'LOGIN' | 'SIGNUP';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { conversations, totalUnreadCount } = useMessages();
  const { photographers } = usePhotographers();
  
  const [appState, setAppState] = useState<AppState>('ONBOARDING');
  const [authState, setAuthState] = useState<AuthState>('LOGIN');
  const [currentView, setCurrentView] = useState('home');
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null);
  const [isFetchingPhotographer, setIsFetchingPhotographer] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeChatPartner, setActiveChatPartner] = useState<ChatPartnerInfo | null>(null);
  const [exploreFilter, setExploreFilter] = useState('All');
  const [transitionState, setTransitionState] = useState<'idle' | 'closing' | 'closed' | 'opening'>('idle');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const currentUser = tokenManager.getUser();
      if (!currentUser?.id) return [];
      const stored = localStorage.getItem(`clickflicks_favorites_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (_) { return []; }
  });

  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const rootElem = document.getElementById('root');
    if (rootElem) rootElem.scrollTop = 0;
    const mainElem = document.getElementById('app-main-scroll');
    if (mainElem) mainElem.scrollTop = 0;
  };

  useEffect(() => {
    MobileConfigService.init();
  }, []);

  useEffect(() => {
    scrollToTop();
  }, [currentView, selectedPhotographer, selectedConversationId, appState]);

  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`clickflicks_favorites_${user.id}`);
        setFavorites(stored ? JSON.parse(stored) : []);
      } catch (_) { setFavorites([]); }
    } else {
      setFavorites([]);
    }
  }, [user?.id]);

  const [showAppTour, setShowAppTour] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setAppState('MAIN');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const tourKey = `clickflicks_tour_seen_${user.id}`;
      const seen = localStorage.getItem(tourKey);
      if (!seen) {
        const timer = setTimeout(() => {
          setShowAppTour(true);
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user?.id]);

  const handleCloseTour = () => {
    setShowAppTour(false);
    if (user?.id) {
      localStorage.setItem(`clickflicks_tour_seen_${user.id}`, 'true');
    }
  };

  const handleStartTour = () => {
    setShowAppTour(true);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      if (user?.id) {
        try {
          localStorage.setItem(`clickflicks_favorites_${user.id}`, JSON.stringify(updated));
        } catch (_) {}
      }
      return updated;
    });
  };

  const handleGetStarted = () => {
    setTransitionState('closing');
    setTimeout(() => {
        setAppState('AUTH');
        setAuthState('LOGIN');
        setTransitionState('opening');
        setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleAuthSuccess = () => {
    setAppState('MAIN');
    scrollToTop();
  };

  const handleLogout = () => {
    logout();
    setFavorites([]);
    setTransitionState('closing');
    setTimeout(() => {
        setAppState('AUTH');
        setAuthState('LOGIN');
        setTransitionState('opening');
        setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleTabChange = (tab: string) => {
    setCurrentView(tab);
    setExploreFilter('All');
    setSelectedPhotographer(null);
    setSelectedConversationId(null);
    setActiveChatPartner(null);
    scrollToTop();
  };

  const handleCategoryClick = (categoryName: string) => {
    setExploreFilter(categoryName);
    setCurrentView('explore');
    scrollToTop();
  };

  const handlePhotographerClick = async (photographerOrId: string | Photographer) => {
    scrollToTop();
    if (typeof photographerOrId === 'object' && photographerOrId !== null) {
      setSelectedPhotographer(photographerOrId);
      return;
    }
    
    // Check if photographer is in memory cache
    const existing = photographers.find(p => p.id === photographerOrId);
    if (existing) {
      setSelectedPhotographer(existing);
      return;
    }

    setIsFetchingPhotographer(true);
    try {
      const res = await apiClient.get(`/photographers/${photographerOrId}`);
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        const u = item.users || {};
        const portfolio = (item.portfolio_items || []).map((p: any) => p.image_url || p.url || p.thumbnail_url).filter(Boolean);
        const featuredImage = portfolio[0] || u.profile_image_url || null;
        const hourly = item.hourly_rate != null && Number(item.hourly_rate) > 0 ? Number(item.hourly_rate) : null;
        const dayRate = item.day_rate != null && Number(item.day_rate) > 0 ? Number(item.day_rate) : null;
        const rawServices = Array.isArray(item.services) ? item.services : [];
        const primaryCategory = rawServices.length > 0 
          ? (rawServices[0].charAt(0) + rawServices[0].slice(1).toLowerCase().replace('_', ' ')) 
          : 'Portrait';

        setSelectedPhotographer({
          id: item.id,
          name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (item.name || 'Artisan Photographer'),
          title: item.bio || '',
          category: primaryCategory,
          rating: Number(item.average_rating) || 0,
          reviewCount: Number(item.total_bookings) || 0,
          reviewsCount: Number(item.total_bookings) || 0,
          hourlyRate: hourly,
          startingPrice: hourly,
          dayRate: dayRate,
          priceUnit: 'hr',
          location: u.location_city ? `${u.location_city}, ${u.location_country || 'Ghana'}` : 'Ghana',
          imageUrl: featuredImage,
          coverImage: featuredImage,
          avatar: u.profile_image_url || null,
          verified: item.verification_status === 'VERIFIED' || item.is_verified === true || u.is_verified === true || (item.verification_status !== 'UNVERIFIED' && item.verification_status !== 'REJECTED'),
          tier: (item.subscriptions?.tier || 'FREE') as any,
          about: item.bio || null,
          bio: item.bio || null,
          tags: rawServices.map((s: string) => s.replace('_', ' ')),
          portfolio: portfolio,
          gear: Array.isArray(item.equipment_list) && item.equipment_list.length > 0 ? item.equipment_list : []
        });
      }
    } catch (err) {
      console.error('Error opening photographer:', err);
    } finally {
      setIsFetchingPhotographer(false);
      scrollToTop();
    }
  };

  const handleBack = () => {
    setSelectedPhotographer(null);
    scrollToTop();
  };

  const handleOpenChat = (conversationId: string) => {
    const foundConv = conversations.find(c => c.id === conversationId);
    if (foundConv) {
      setActiveChatPartner({
        id: foundConv.participantId,
        name: foundConv.participantName,
        avatar: foundConv.participantImage || foundConv.photographerAvatar || null,
        isOnline: foundConv.online !== false
      });
    }

    setTransitionState('closing');
    setTimeout(() => {
        setSelectedConversationId(conversationId);
        setSelectedPhotographer(null);
        setTransitionState('opening');
        setTimeout(() => setTransitionState('idle'), 900);
        scrollToTop();
    }, 900);
  };

  const handleOpenChatByPhotographer = (photographerIdOrObj: string | Photographer | any, bookingId?: string) => {
    let pId = typeof photographerIdOrObj === 'string' ? photographerIdOrObj : (photographerIdOrObj.userId || photographerIdOrObj.id);
    let pName = typeof photographerIdOrObj === 'object' ? photographerIdOrObj.name : undefined;
    let pAvatar = typeof photographerIdOrObj === 'object' ? (photographerIdOrObj.imageUrl || photographerIdOrObj.avatar) : undefined;

    if (!pName) {
      const matchP = photographers.find(p => p.id === pId || (p as any).userId === pId);
      if (matchP) {
        pName = matchP.name;
        pAvatar = matchP.imageUrl || matchP.avatar;
        pId = (matchP as any).userId || matchP.id;
      }
    }

    // Check if an existing conversation between this client and photographer exists
    const found = conversations.find(c => 
      c.participantId === pId ||
      c.photographerId === pId ||
      (bookingId && c.id === bookingId) ||
      c.id === pId
    );

    if (found) {
      pName = pName || found.participantName || found.photographerName;
      pAvatar = pAvatar || found.participantImage || found.photographerAvatar;
    }

    setActiveChatPartner({
      id: pId,
      name: pName || 'Studio Artisan',
      avatar: pAvatar || null,
      isOnline: true
    });

    const targetConvId = found ? found.id : (bookingId || pId);

    setTransitionState('closing');
    setTimeout(() => {
      setSelectedConversationId(targetConvId);
      setSelectedPhotographer(null);
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
      scrollToTop();
    }, 900);
  };

  return (
    <Layout 
      fullScreen={appState === 'ONBOARDING' || appState === 'AUTH'} 
      scrollTrigger={[currentView, selectedPhotographer?.id, selectedConversationId, appState]}
      onHome={() => {
        setSelectedPhotographer(null);
        setSelectedConversationId(null);
        setActiveChatPartner(null);
        setCurrentView('home');
        scrollToTop();
      }}
    >
      <ApertureTransition state={transitionState} />

      {appState === 'AUTH' && (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
           <video 
             ref={videoRef}
             autoPlay 
             muted 
             loop 
             playsInline
             className="w-full h-full object-cover scale-110 blur-[1px] opacity-70"
             poster="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop"
           >
             <source src="https://assets.mixkit.co/videos/preview/mixkit-background-of-a-cloud-of-black-ink-in-water-4328-large.mp4" type="video/mp4" />
           </video>
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-10" />
        </div>
      )}

      <div className="relative z-20 h-full">
        {appState === 'ONBOARDING' && <Welcome onGetStarted={handleGetStarted} />}

        {appState === 'AUTH' && (
            <div className="h-full flex flex-col">
              {authState === 'LOGIN' && (
                <Login 
                  onBack={() => setAppState('ONBOARDING')} 
                  onRegister={() => setAuthState('SIGNUP')} 
                  onSuccess={handleAuthSuccess} 
                />
              )}
              {authState === 'SIGNUP' && (
                <Signup 
                  onBack={() => setAuthState('LOGIN')} 
                  onSuccess={handleAuthSuccess} 
                />
              )}
            </div>
        )}

        {appState === 'MAIN' && (
            <>
            {isFetchingPhotographer ? (
              <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <AperturePulseLoader label="Connecting to studio profile..." />
              </div>
            ) : selectedPhotographer ? (
                <PhotographerDetail 
                  photographer={selectedPhotographer} 
                  onBack={handleBack} 
                  onOpenChat={(photographerObj) => handleOpenChatByPhotographer(photographerObj || selectedPhotographer)}
                  isFavorite={favorites.includes(selectedPhotographer.id)}
                  onToggleFavorite={() => toggleFavorite(selectedPhotographer.id)}
                />
            ) : selectedConversationId ? (
                <ChatDetail 
                    conversationId={selectedConversationId} 
                    chatPartner={activeChatPartner}
                    onBack={() => {
                        setTransitionState('closing');
                        setTimeout(() => {
                            setSelectedConversationId(null);
                            setActiveChatPartner(null);
                            setTransitionState('opening');
                            setTimeout(() => setTransitionState('idle'), 900);
                            scrollToTop();
                        }, 900);
                    }} 
                    onViewProfile={(photographerId) => {
                      setSelectedConversationId(null);
                      setActiveChatPartner(null);
                      handlePhotographerClick(photographerId);
                    }}
                />
            ) : (
                <>
                    {currentView === 'home' && (
                    <Home 
                        onPhotographerClick={handlePhotographerClick} 
                        onSearchFocus={() => handleTabChange('explore')} 
                        onCategoryClick={handleCategoryClick}
                        onGeminiClick={() => setCurrentView('ai-concierge')} 
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                    />
                    )}
                    {currentView === 'explore' && (
                    <Explore 
                        initialFilter={exploreFilter}
                        onPhotographerClick={handlePhotographerClick} 
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                    />
                    )}
                    {currentView === 'messages' && (
                        <Messages onConversationClick={handleOpenChat} />
                    )}
                    {currentView === 'ai-concierge' && <AIConcierge />}
                    {currentView === 'bookings' && (
                      <Bookings 
                        onTabChange={handleTabChange} 
                        onOpenChat={(pId, bId) => {
                          const matchPhotographer = photographers.find(p => p.id === pId);
                          handleOpenChatByPhotographer(matchPhotographer || pId, bId);
                        }} 
                      />
                    )}
                    {currentView === 'profile' && (
                    <Profile 
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        onViewPhotographer={handlePhotographerClick}
                        onLogout={handleLogout}
                        onStartTour={handleStartTour}
                    />
                    )}
                    <BottomNav activeTab={currentView} onTabChange={handleTabChange} unreadMessagesCount={totalUnreadCount} />
                </>
            )}
            </>
        )}
      </div>

      <AppTourModal 
        isOpen={showAppTour} 
        onClose={handleCloseTour} 
        onTabChange={handleTabChange} 
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
