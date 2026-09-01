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
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePhotographerBookings } from './hooks/usePhotographerBookings';
import { useMessages } from './hooks/useMessages';

type FlowState = 'onboarding' | 'auth' | 'kyc' | 'app';
type AuthMode = 'login' | 'signup';
type KYCStatus = 'pending' | 'submitted' | 'verified';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, logout, user } = useAuth();
  const { bookings } = usePhotographerBookings();
  const { conversations } = useMessages();

  const [flowState, setFlowState] = useState<FlowState>('app');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [kycStatus, setKycStatus] = useState<KYCStatus>('submitted');
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeChatPartner, setActiveChatPartner] = useState<ChatPartnerInfo | null>(null);
  const [transitionState, setTransitionState] = useState<'idle' | 'closing' | 'opening'>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Dynamic notification counts from live database
  const pendingRequestsCount = bookings.filter(b => b.status === 'pending' || (b.status as any) === 'PENDING').length;
  const unreadMessagesCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  useEffect(() => {
    initPushNotifications();

    const hasOnboarded = localStorage.getItem('clickflicks_photographer_onboarded') === 'true';
    const savedKyc = localStorage.getItem('clickflicks_photographer_kyc') as KYCStatus | null;

    if (savedKyc) setKycStatus(savedKyc);

    if (!hasOnboarded) {
      setFlowState('onboarding');
    } else if (!isAuthLoading && !isAuthenticated) {
      setFlowState('auth');
    } else if (!isAuthLoading && isAuthenticated && flowState === 'auth') {
      setFlowState('app');
    }
  }, [isAuthenticated, isAuthLoading]);

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

  const handleAuthSuccess = () => {
    const isKYCCompleted = localStorage.getItem('clickflicks_photographer_kyc');
    
    setTransitionState('closing');
    setTimeout(() => {
      if (!isKYCCompleted) {
        setFlowState('kyc');
      } else {
        setFlowState('app');
      }
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleKYCComplete = () => {
    localStorage.setItem('clickflicks_photographer_kyc', 'submitted');
    setKycStatus('submitted');
    setTransitionState('closing');
    setTimeout(() => {
      setFlowState('app');
      setTransitionState('opening');
      setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleLogout = () => {
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
            onSkip={() => {
              setFlowState('app');
            }} 
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
                    onNavigateKYC={() => setFlowState('kyc')}
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
