import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import PhotographerDashboard from './pages/PhotographerDashboard';
import PhotographerRequests from './pages/PhotographerRequests';
import PhotographerSchedule from './pages/PhotographerSchedule';
import PhotographerStudio from './pages/PhotographerStudio';
import PhotographerKYC from './pages/PhotographerKYC';
import PhotographerAI from './pages/PhotographerAI';
import Messages from './pages/Messages';
import ChatDetail, { ChatPartnerInfo } from './pages/ChatDetail';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ApertureTransition from './components/ApertureTransition';
import { initPushNotifications } from './services/PushNotificationService';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/ui/icons';
import { MobileConfigService, InAppMessageItem, VersionCheckInfo } from './services/MobileConfigService';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePhotographerBookings } from './hooks/usePhotographerBookings';
import { useMessages } from './hooks/useMessages';
import { apiClient, tokenManager } from './lib/api-client';
import { AppUpdateModal, CURRENT_PHOTOGRAPHER_APP_VERSION } from './components/AppUpdateModal';
import { CapgoUpdateService } from './services/CapgoUpdateService';

const CURRENT_APP_VERSION = CURRENT_PHOTOGRAPHER_APP_VERSION;

type FlowState = 'onboarding' | 'auth' | 'kyc' | 'app';
type AuthMode = 'login' | 'signup';
type KYCStatus = 'pending' | 'submitted' | 'verified';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, logout, user, photographerProfile, fetchProfile } = useAuth();
  const { bookings } = usePhotographerBookings();
  const { conversations } = useMessages();

  const [flowState, setFlowState] = useState<FlowState>(() => {
    if (typeof window !== 'undefined' && tokenManager.getToken()) {
      return 'app';
    }
    const onboarded = typeof window !== 'undefined' && localStorage.getItem('clickflicks_photographer_onboarded') === 'true';
    return onboarded ? 'auth' : 'onboarding';
  });
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [kycStatus, setKycStatus] = useState<KYCStatus>('pending');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeChatPartner, setActiveChatPartner] = useState<ChatPartnerInfo | null>(null);
  const [transitionState, setTransitionState] = useState<'idle' | 'closing' | 'opening'>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeInAppMessage, setActiveInAppMessage] = useState<InAppMessageItem | null>(null);
  const [updateNotice, setUpdateNotice] = useState<VersionCheckInfo | null>(null);
  const [updateReadyVersion, setUpdateReadyVersion] = useState<string | null>(null);
  const [showNewReleaseModal, setShowNewReleaseModal] = useState<boolean>(false);

  // Dynamic notification counts from live database
  const pendingRequestsCount = bookings.filter(b => b.status === 'pending' || (b.status as any) === 'PENDING').length;
  const unreadMessagesCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const getResolvedKYCStatus = (): KYCStatus => {
    // Only genuine verified: photographer verification_status === 'VERIFIED' AND photographer_kyc is APPROVED
    if (
      photographerProfile?.verification_status === 'VERIFIED' && 
      (photographerProfile?.photographer_kyc?.kyc_status === 'APPROVED' || (photographerProfile as any)?.kyc_verified_at != null)
    ) {
      return 'verified';
    }
    // Submitted status: photographer has actually submitted their KYC records for review
    if (
      photographerProfile?.photographer_kyc?.kyc_status === 'SUBMITTED' || 
      photographerProfile?.photographer_kyc?.kyc_status === 'IN_REVIEW'
    ) {
      return 'submitted';
    }
    if (typeof window !== 'undefined' && user?.id) {
      const userKyc = localStorage.getItem(`clickflicks_photographer_kyc_${user.id}`);
      if (userKyc === 'submitted') return 'submitted';
      if (userKyc === 'verified' && photographerProfile?.verification_status === 'VERIFIED') return 'verified';
    }
    return 'pending';
  };

  useEffect(() => {
    initPushNotifications();
    MobileConfigService.init();
    CapgoUpdateService.init((ver) => {
      setUpdateReadyVersion(ver);
    });

    const handleInAppMessages = (e: Event) => {
      const customEvent = e as CustomEvent<InAppMessageItem[]>;
      const messages = customEvent.detail || [];
      if (messages.length > 0) {
        const unread = messages.find(m => !localStorage.getItem(`clickflicks_pro_msg_dismissed_${m.id}`));
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
      if (!localStorage.getItem(`clickflicks_pro_update_dismissed_${update.latestVersion}`)) {
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

    const token = tokenManager.getToken();
    const hasOnboarded = localStorage.getItem('clickflicks_photographer_onboarded') === 'true';

    // If authenticated or token exists, KEEP user in active session across all updates
    if (isAuthenticated || token) {
      localStorage.setItem('clickflicks_photographer_onboarded', 'true');
      const currentKyc = getResolvedKYCStatus();
      setKycStatus(currentKyc);

      setFlowState(prev => {
        // If already inside the app, NEVER kick the user back to KYC
        if (prev === 'app') return 'app';
        const hasSkipped = typeof window !== 'undefined' && (
          localStorage.getItem('clickflicks_photographer_kyc_skipped') === 'true' ||
          (user?.id && localStorage.getItem(`clickflicks_photographer_kyc_skipped_${user.id}`) === 'true')
        );
        if (hasSkipped) return 'app';
        if (prev === 'auth' || prev === 'onboarding') {
          return currentKyc === 'pending' ? 'kyc' : 'app';
        }
        return prev;
      });
    } else if (!isAuthLoading) {
      if (hasOnboarded) {
        setFlowState('auth');
      } else {
        setFlowState('onboarding');
      }
    }

    return () => {
      window.removeEventListener('clickflicks:in-app-messages', handleInAppMessages);
      window.removeEventListener('clickflicks:soft-update', handleSoftUpdate);
      window.removeEventListener('clickflicks:force-update', handleForceUpdate);
    };
  }, [isAuthenticated, isAuthLoading, photographerProfile, user?.id]);

  const handleInAppAction = (msg: InAppMessageItem) => {
    localStorage.setItem(`clickflicks_pro_msg_dismissed_${msg.id}`, 'true');
    // Telemetry: record CTA click on mobile
    apiClient.post(`/mobile/in-app-messages/${msg.id}/click`).catch(() => {});
    setActiveInAppMessage(null);
    if (msg.deepLink) {
      if (msg.deepLink.includes('requests')) handleTabChange('requests');
      else if (msg.deepLink.includes('schedule')) handleTabChange('schedule');
      else if (msg.deepLink.includes('messages')) handleTabChange('messages');
      else if (msg.deepLink.includes('studio')) handleTabChange('studio');
      else if (msg.deepLink.includes('dashboard')) handleTabChange('dashboard');
    }
  };

  const handleDismissMessage = (msg: InAppMessageItem) => {
    localStorage.setItem(`clickflicks_pro_msg_dismissed_${msg.id}`, 'true');
    setActiveInAppMessage(null);
  };

  useEffect(() => {
    if (flowState === 'auth' && videoRef.current) {
      videoRef.current.play().catch(e => console.log(e));
    }
  }, [flowState]);

  const handleOnboardingComplete = () => {
    setTransitionState('closing');
    setTimeout(() => {
      localStorage.setItem('clickflicks_photographer_onboarded', 'true');
      setFlowState('auth');
      setAuthMode('signup');
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleAuthSuccess = async () => {
    try {
      await fetchProfile();
    } catch (_) {}
    setTransitionState('closing');
    setTimeout(() => {
      const currentKyc = getResolvedKYCStatus();
      setKycStatus(currentKyc);
      const hasSkipped = typeof window !== 'undefined' && (
        localStorage.getItem('clickflicks_photographer_kyc_skipped') === 'true' ||
        (user?.id && localStorage.getItem(`clickflicks_photographer_kyc_skipped_${user.id}`) === 'true')
      );
      if (currentKyc === 'pending' && !hasSkipped) {
        setFlowState('kyc');
      } else {
        setFlowState('app');
      }
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleKYCSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clickflicks_photographer_kyc_skipped', 'true');
      if (user?.id) {
        localStorage.setItem(`clickflicks_photographer_kyc_skipped_${user.id}`, 'true');
      }
    }
    setTransitionState('closing');
    setTimeout(() => {
      setFlowState('app');
      setCurrentView('studio');
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 400);
    }, 200);
  };

  const handleKYCComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clickflicks_photographer_kyc_completed', 'true');
      localStorage.setItem('clickflicks_photographer_kyc_status', 'submitted');
      localStorage.removeItem('clickflicks_photographer_kyc_skipped');
      if (user?.id) {
        localStorage.setItem(`clickflicks_photographer_kyc_${user.id}`, 'submitted');
        localStorage.removeItem(`clickflicks_photographer_kyc_skipped_${user.id}`);
      }
    }
    setKycStatus('submitted');
    fetchProfile().catch(() => {});
    setTransitionState('closing');
    setTimeout(() => {
      setFlowState('app');
      setCurrentView('studio');
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 400);
    }, 200);
  };

  const handleNavigateKYC = () => {
    const current = getResolvedKYCStatus();
    if (current === 'verified') {
      // Fully approved by admin: credentials are locked & non-editable
      setCurrentView('studio');
      return;
    }

    // Until fully approved (pending, draft, submitted, under review), allow navigating to KYC to edit/resubmit
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clickflicks_photographer_kyc_skipped');
      if (user?.id) {
        localStorage.removeItem(`clickflicks_photographer_kyc_skipped_${user.id}`);
      }
    }
    setTransitionState('closing');
    setTimeout(() => {
      setFlowState('kyc');
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 400);
    }, 200);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('clickflicks_photographer_kyc_skipped');
    }
    logout();
    setTransitionState('closing');
    setTimeout(() => {
      setFlowState('auth');
      setAuthMode('login');
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleTabChange = (tab: string) => {
    setCurrentView(tab);
    setSelectedConversationId(null);
    setActiveChatPartner(null);
  };

  const handleOpenChat = (conversationId: string, partnerInfo?: ChatPartnerInfo | null) => {
    // 1. Check if an existing conversation between this photographer and client exists
    let targetConvId = conversationId;
    let partner = partnerInfo || null;

    if (partnerInfo?.id) {
      const found = conversations.find(c => 
        c.photographerId === partnerInfo.id || 
        c.id === conversationId || 
        c.id === partnerInfo.id
      );
      if (found) {
        targetConvId = found.id;
        partner = {
          id: partnerInfo.id,
          name: partnerInfo.name || found.photographerName,
          avatar: partnerInfo.avatar || found.photographerAvatar || null,
          isOnline: true
        };
      }
    } else {
      const found = conversations.find(c => c.id === conversationId);
      if (found) {
        partner = {
          id: found.photographerId,
          name: found.photographerName,
          avatar: found.photographerAvatar || null,
          isOnline: true
        };
      }
    }

    setActiveChatPartner(partner);

    setTransitionState('closing');
    setTimeout(() => {
      setSelectedConversationId(targetConvId);
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  return (
    <Layout 
      fullScreen={flowState !== 'app'} 
      onHome={() => {
        setSelectedConversationId(null);
        setActiveChatPartner(null);
        setCurrentView('dashboard');
      }}
    >
      <ApertureTransition state={transitionState} />

      {flowState === 'auth' && (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
           <video 
             ref={videoRef}
             autoPlay 
             muted 
             loop 
             playsInline
             className="w-full h-full object-cover scale-110 blur-[1px] opacity-60"
             poster="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop"
           >
             <source src="https://assets.mixkit.co/videos/preview/mixkit-background-of-a-cloud-of-black-ink-in-water-4328-large.mp4" type="video/mp4" />
           </video>
           <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/95 z-10" />
        </div>
      )}

      <div className="relative z-20 h-full">
        {flowState === 'onboarding' && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}

        {flowState === 'auth' && (
          <div className="h-full flex flex-col">
            {authMode === 'login' && (
              <Login 
                onBack={() => setFlowState('onboarding')} 
                onRegister={() => setAuthMode('signup')}
                onSuccess={handleAuthSuccess} 
              />
            )}
            {authMode === 'signup' && (
              <Signup 
                onBack={() => setAuthMode('login')} 
                onSuccess={handleAuthSuccess} 
              />
            )}
          </div>
        )}

        {flowState === 'kyc' && (
          <PhotographerKYC 
            onComplete={handleKYCComplete} 
            onSkip={handleKYCSkip} 
          />
        )}

        {flowState === 'app' && (
          <>
            {selectedConversationId ? (
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
                  }, 900);
                }} 
              />
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <PhotographerDashboard 
                    kycStatus={kycStatus} 
                    onGeminiClick={() => setCurrentView('ai-concierge')} 
                    onNavigateTab={handleTabChange}
                    onNavigateKYC={handleNavigateKYC}
                  />
                )}
                {currentView === 'requests' && (
                  <PhotographerRequests 
                    onOpenChat={(clientId, bookingId) => {
                      const foundBooking = bookings.find(b => b.id === bookingId || b.clientId === clientId);
                      const clientName = foundBooking?.clientName || 'Private Client';
                      const clientAvatar = foundBooking?.clientAvatar || null;
                      handleOpenChat(bookingId || clientId, { id: clientId, name: clientName, avatar: clientAvatar, isOnline: true });
                    }}
                  />
                )}
                {currentView === 'schedule' && <PhotographerSchedule />}
                {currentView === 'messages' && <Messages onConversationClick={handleOpenChat} />}
                {currentView === 'studio' && (
                  <PhotographerStudio 
                    onLogout={handleLogout}
                    onNavigateKYC={handleNavigateKYC}
                    kycStatus={kycStatus}
                  />
                )}
                {currentView === 'ai-concierge' && <PhotographerAI />}
                <BottomNav 
                  activeTab={currentView} 
                  onTabChange={handleTabChange} 
                  unreadCount={unreadMessagesCount}
                  pendingRequestsCount={pendingRequestsCount}
                />
              </>
            )}
          </>
        )}
      </div>

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
                  <span>Open Now</span>
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
                <button
                  onClick={() => {
                    localStorage.setItem(`clickflicks_pro_update_dismissed_${updateNotice.latestVersion}`, 'true');
                    setUpdateNotice(null);
                  }}
                  className="w-full py-2.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {updateNotice.forceUpdate ? 'Continue for now' : 'Remind Me Later'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live OTA Update Pill when new bundle downloaded */}
      <AnimatePresence>
        {updateReadyVersion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-[9999] mx-auto max-w-sm bg-gray-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-teal-500/40"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Icons.Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Update v{updateReadyVersion} Ready</p>
                <p className="text-[10px] text-gray-400">Restart now to apply changes</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => CapgoUpdateService.applyUpdateNow()}
              className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all active:scale-95 shrink-0"
            >
              Restart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Update Announcement Modal (shows once after restart) */}
      <AppUpdateModal />
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
