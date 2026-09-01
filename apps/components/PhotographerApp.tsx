import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import BottomNav from './BottomNav';
import PhotographerDashboard from '../pages/PhotographerDashboard';
import PhotographerRequests from '../pages/PhotographerRequests';
import PhotographerSchedule from '../pages/PhotographerSchedule';
import PhotographerStudio from '../pages/PhotographerStudio';
import PhotographerKYC from '../pages/PhotographerKYC';
import PhotographerAI from '../pages/PhotographerAI';
import Messages from '../pages/Messages';
import ChatDetail from '../pages/ChatDetail';
import Onboarding from '../pages/Onboarding';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import { UserType } from '../types';
import { Icons } from './ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotographerAppProps {
  onExit: () => void;
}

type FlowState = 'onboarding' | 'auth' | 'kyc' | 'app';
type AuthMode = 'login' | 'signup';
type KycStatus = 'pending' | 'submitted' | 'verified';

const PhotographerApp: React.FC<PhotographerAppProps> = ({ onExit }) => {
  const [flowState, setFlowState] = useState<FlowState>('onboarding');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [kycStatus, setKycStatus] = useState<KycStatus>('pending');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Determine initial state
    const hasOnboarded = localStorage.getItem('lc_photographer_onboarded') === 'true';
    const hasAuth = localStorage.getItem('lc_photographer_auth') === 'true';
    const savedKycStatus = localStorage.getItem('lenscreate_photographer_kyc_status') as KycStatus;

    if (savedKycStatus) setKycStatus(savedKycStatus);

    if (!hasOnboarded) {
      setFlowState('onboarding');
    } else if (!hasAuth) {
      setFlowState('auth');
    } else {
      // If auth is present, always go to app.
      // We no longer block access for pending KYC on login/initial load.
      setFlowState('app');
    }
  }, []);

  useEffect(() => {
    if (flowState === 'auth' && videoRef.current) {
        videoRef.current.play().catch(e => console.log(e));
    }
  }, [flowState]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('lc_photographer_onboarded', 'true');
    setFlowState('auth');
    setAuthMode('login');
  };

  const handleAuthSuccess = () => {
    localStorage.setItem('lc_photographer_auth', 'true');
    const savedKycStatus = localStorage.getItem('lenscreate_photographer_kyc_status') as KycStatus;
    
    if (savedKycStatus) setKycStatus(savedKycStatus);

    if (authMode === 'signup') {
        // New signups still go to KYC flow to capture details initially
        setFlowState('kyc');
    } else {
        // Logins go straight to App regardless of KYC status
        setFlowState('app');
    }
  };

  const handleKYCComplete = () => {
    localStorage.setItem('lenscreate_photographer_kyc_status', 'submitted');
    setKycStatus('submitted');
    setFlowState('app'); // Go straight to app after submission
  };

  const handleLogout = () => {
    localStorage.removeItem('lc_photographer_auth');
    // We keep onboarding state true so they don't see onboarding again
    setFlowState('auth');
    setAuthMode('login');
    setCurrentView('dashboard');
  };

  const handleTabChange = (tab: string) => {
    setCurrentView(tab);
    setSelectedConversationId(null);
  };

  const handleOpenChat = (id: string) => {
    setSelectedConversationId(id);
    if (currentView !== 'messages') {
        // Don't switch tab immediately, just overlay chat
    }
  };

  return (
    <Layout onHome={onExit} fullScreen={flowState === 'onboarding' || flowState === 'auth'}>
      {flowState === 'auth' && (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
           <video 
             ref={videoRef}
             autoPlay 
             muted 
             loop 
             playsInline
             className="w-full h-full object-cover scale-110 blur-[1px] opacity-70"
             poster="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop"
           >
             <source src="https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-326-large.mp4" type="video/mp4" />
           </video>
           <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-10" />
        </div>
      )}

      {flowState === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} userType={UserType.PHOTOGRAPHER} />
      )}

      {flowState === 'auth' && (
        <div className="relative z-20 h-full flex flex-col">
            {authMode === 'login' ? (
                <Login 
                    onBack={onExit} 
                    onRegister={() => setAuthMode('signup')}
                    onSuccess={handleAuthSuccess} 
                />
            ) : (
                <Signup 
                    onBack={() => setAuthMode('login')} 
                    onSuccess={handleAuthSuccess} 
                    initialUserType={UserType.PHOTOGRAPHER}
                />
            )}
        </div>
      )}

      {flowState === 'kyc' && (
        <PhotographerKYC onComplete={handleKYCComplete} />
      )}

      {flowState === 'app' && (
        <>
            {selectedConversationId ? (
                <ChatDetail 
                    conversationId={selectedConversationId} 
                    onBack={() => setSelectedConversationId(null)} 
                />
            ) : (
                <>
                    {currentView === 'dashboard' && (
                        <PhotographerDashboard 
                            kycStatus={kycStatus} 
                            onGeminiClick={() => setCurrentView('ai-concierge')}
                        />
                    )}
                    {currentView === 'requests' && <PhotographerRequests />}
                    {currentView === 'schedule' && (
                        <PhotographerSchedule 
                            onOpenChat={() => handleOpenChat('c1')} 
                        />
                    )}
                    {currentView === 'messages' && <Messages onConversationClick={handleOpenChat} />}
                    {currentView === 'studio' && (
                        <PhotographerStudio 
                            onLogout={handleLogout} 
                            kycStatus={kycStatus}
                        />
                    )}
                    {currentView === 'ai-concierge' && <PhotographerAI />}
                    <BottomNav activeTab={currentView === 'ai-concierge' ? 'dashboard' : currentView} onTabChange={handleTabChange} userType={UserType.PHOTOGRAPHER} />
                </>
            )}
        </>
      )}
    </Layout>
  );
};

export default PhotographerApp;