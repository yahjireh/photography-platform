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
import apiClient, { tokenManager } from './lib/api-client';
import { cacheGet, cacheSet } from './lib/cache';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/ui/icons';
import { MobileConfigService, InAppMessageItem, VersionCheckInfo } from './services/MobileConfigService';

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
  const [activeInAppMessage, setActiveInAppMessage] = useState<InAppMessageItem | null>(null);
  const [updateNotice, setUpdateNotice] = useState<VersionCheckInfo | null>(null);

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

    const handleInAppMessages = (e: Event) => {
      const customEvent = e as CustomEvent<InAppMessageItem[]>;
      const messages = customEvent.detail || [];
      if (messages.length > 0) {
        const unread = messages.find(m => {
          const dismissed = localStorage.getItem(`clickflicks_msg_dismissed_${m.id}`);
          return !dismissed;
        });
        if (unread) {
          setActiveInAppMessage(unread);
          // Telemetry: record view on mobile
          apiClient.post(`/mobile/in-app-messages/${unread.id}/view`).catch(() => {});
        }
      }
    };

    const handleSoftUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VersionCheckInfo>;
      const update = customEvent.detail;
      const dismissed = localStorage.getItem(`clickflicks_update_dismissed_${update.latestVersion}`);
      if (!dismissed) {
        setUpdateNotice(update);
      }
    };

    const handleForceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VersionCheckInfo>;
      setUpdateNotice(customEvent.detail);
    };

    window.addEventListener('clickflicks:in-app-messages', handleInAppMessages);
    window.addEventListener('clickflicks:soft-update', handleSoftUpdate);
    window.addEventListener('clickflicks:force-update', handleForceUpdate);

    return () => {
      window.removeEventListener('clickflicks:in-app-messages', handleInAppMessages);
      window.removeEventListener('clickflicks:soft-update', handleSoftUpdate);
      window.removeEventListener('clickflicks:force-update', handleForceUpdate);
    };
  }, []);

  const handleInAppAction = (msg: InAppMessageItem) => {
    localStorage.setItem(`clickflicks_msg_dismissed_${msg.id}`, 'true');
    // Telemetry: record CTA click on mobile
    apiClient.post(`/mobile/in-app-messages/${msg.id}/click`).catch(() => {});
    setActiveInAppMessage(null);
    if (msg.deepLink) {
      if (msg.deepLink.includes('explore')) {
        handleTabChange('explore');
      } else if (msg.deepLink.includes('bookings')) {
        handleTabChange('bookings');
      } else if (msg.deepLink.includes('messages')) {
        handleTabChange('messages');
      } else if (msg.deepLink.includes('profile')) {
        handleTabChange('profile');
      } else if (msg.deepLink.includes('concierge') || msg.deepLink.includes('ai')) {
        setCurrentView('ai-concierge');
      }
    }
  };

  const handleDismissMessage = (msg: InAppMessageItem) => {
    localStorage.setItem(`clickflicks_msg_dismissed_${msg.id}`, 'true');
    setActiveInAppMessage(null);
  };

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

      {/* Remote In-App Message Modal from Admin Dashboard */}
      <AnimatePresence>
        {activeInAppMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 text-center overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => handleDismissMessage(activeInAppMessage)}
                className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
                aria-label="Close"
              >
                <Icons.X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-inner">
                <Icons.Sparkles className="w-8 h-8" />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {activeInAppMessage.type || 'Notice'}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                {activeInAppMessage.title}
              </h3>

              {/* Body */}
              <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                {activeInAppMessage.body}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleInAppAction(activeInAppMessage)}
                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Now</span>
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDismissMessage(activeInAppMessage)}
                  className="w-full py-2.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remote Version / Force Update Modal from Admin Dashboard */}
      <AnimatePresence>
        {updateNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <Icons.Download className="w-8 h-8 animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
                {updateNotice.forceUpdate ? 'Critical Update Required' : 'New Version Available'}
              </div>

              <h3 className="text-xl font-bold text-white mb-1.5">
                Update to v{updateNotice.latestVersion}
              </h3>
              <p className="text-xs text-neutral-400 mb-3">
                You are currently running v{updateNotice.currentVersion}
              </p>

              {updateNotice.releaseNotes && (
                <div className="p-3 bg-neutral-800/80 rounded-xl border border-neutral-700/60 text-xs text-neutral-300 text-left mb-5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mb-1">Release Notes</div>
                  {updateNotice.releaseNotes}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    window.open(updateNotice.storeUrl || 'https://clickflicks.com', '_blank');
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Update Now
                </button>
                {!updateNotice.forceUpdate && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem(`clickflicks_update_dismissed_${updateNotice.latestVersion}`, 'true');
                      setUpdateNotice(null);
                    }}
                    className="w-full py-2 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Remind Me Later
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
