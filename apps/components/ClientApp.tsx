import React, { useState, useEffect, useRef } from 'react';
import Layout from './Layout';
import BottomNav from './BottomNav';
import Home from '../pages/Home';
import Explore from '../pages/Explore';
import Bookings from '../pages/Bookings';
import Profile from '../pages/Profile';
import Messages from '../pages/Messages';
import ChatDetail from '../pages/ChatDetail';
import PhotographerDetail from '../pages/PhotographerDetail';
import AIConcierge from '../pages/AIConcierge';
import Welcome from '../pages/Welcome';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ApertureTransition from './ApertureTransition';
import { MOCK_PHOTOGRAPHERS, MOCK_CONVERSATIONS } from '../constants';
import { Photographer, UserType } from '../types';

interface ClientAppProps {
  onExit: () => void;
}

type AppState = 'ONBOARDING' | 'AUTH' | 'MAIN';
type AuthState = 'LOGIN' | 'SIGNUP';

const ClientApp: React.FC<ClientAppProps> = ({ onExit }) => {
  const [appState, setAppState] = useState<AppState>('MAIN'); // Default to MAIN for smoother demo flow
  const [authState, setAuthState] = useState<AuthState>('LOGIN');
  const [transitionState, setTransitionState] = useState<'idle' | 'closing' | 'opening'>('idle');
  const [currentView, setCurrentView] = useState('home');
  const [exploreFilter, setExploreFilter] = useState('All');
  const [selectedPhotographer, setSelectedPhotographer] = useState<Photographer | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initial check (simulated)
    const hasOnboarded = localStorage.getItem('lenscreate_client_onboarding') === 'true';
    const isAuthenticated = localStorage.getItem('lenscreate_client_auth') === 'true';
    const savedFavorites = localStorage.getItem('lenscreate_favorites');

    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

    if (!hasOnboarded) {
      setAppState('ONBOARDING');
    } else if (!isAuthenticated) {
      setAppState('AUTH');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lenscreate_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (appState === 'AUTH' && videoRef.current) {
        videoRef.current.play().catch(e => console.log(e));
    }
  }, [appState]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const handleGetStarted = () => {
    setTransitionState('closing');
    setTimeout(() => {
        localStorage.setItem('lenscreate_client_onboarding', 'true');
        setAppState('AUTH');
        setAuthState('SIGNUP');
        setTransitionState('opening');
        setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleAuthSuccess = () => {
    localStorage.setItem('lenscreate_client_auth', 'true');
    setAppState('MAIN');
  };

  const handleLogout = () => {
    localStorage.removeItem('lenscreate_client_auth');
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
  };

  const handleCategoryClick = (categoryName: string) => {
    setExploreFilter(categoryName);
    setCurrentView('explore');
  };

  const handlePhotographerClick = (id: string) => {
    const photographer = MOCK_PHOTOGRAPHERS.find(p => p.id === id);
    if (photographer) setSelectedPhotographer(photographer);
  };

  const handleBack = () => setSelectedPhotographer(null);

  const handleOpenChat = (conversationId: string) => {
    setTransitionState('closing');
    setTimeout(() => {
        setSelectedConversationId(conversationId);
        setSelectedPhotographer(null);
        setTransitionState('opening');
        setTimeout(() => setTransitionState('idle'), 900);
    }, 900);
  };

  const handleOpenChatByPhotographer = (photographerId: string) => {
    const conv = MOCK_CONVERSATIONS.find(c => c.participantId === photographerId);
    if (conv) {
      handleOpenChat(conv.id);
    } else {
      setCurrentView('messages');
    }
  };

  return (
    <Layout fullScreen={appState === 'ONBOARDING' || appState === 'AUTH'} onHome={onExit}>
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
              {authState === 'LOGIN' && <Login onBack={onExit} onRegister={() => setAuthState('SIGNUP')} onSuccess={handleAuthSuccess} />}
              {authState === 'SIGNUP' && <Signup onBack={() => setAuthState('LOGIN')} onSuccess={handleAuthSuccess} />}
            </div>
        )}

        {appState === 'MAIN' && (
            <>
            {selectedPhotographer ? (
                <PhotographerDetail 
                  photographer={selectedPhotographer} 
                  onBack={handleBack} 
                  onOpenChat={() => handleOpenChatByPhotographer(selectedPhotographer.id)}
                  isFavorite={favorites.includes(selectedPhotographer.id)}
                  onToggleFavorite={() => toggleFavorite(selectedPhotographer.id)}
                />
            ) : selectedConversationId ? (
                <ChatDetail 
                    conversationId={selectedConversationId} 
                    onBack={() => {
                        setTransitionState('closing');
                        setTimeout(() => {
                            setSelectedConversationId(null);
                            setTransitionState('opening');
                            setTimeout(() => setTransitionState('idle'), 900);
                        }, 900);
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
                    {currentView === 'bookings' && <Bookings onTabChange={handleTabChange} onOpenChat={handleOpenChatByPhotographer} />}
                    {currentView === 'profile' && (
                    <Profile 
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        onViewPhotographer={handlePhotographerClick}
                        onLogout={handleLogout}
                    />
                    )}
                    <BottomNav activeTab={currentView} onTabChange={handleTabChange} userType={UserType.CLIENT} />
                </>
            )}
            </>
        )}
      </div>
    </Layout>
  );
};

export default ClientApp;