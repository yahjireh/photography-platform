import React from 'react';
import { Icons } from './ui/icons';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
  pendingRequestsCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange,
  unreadCount = 0,
  pendingRequestsCount = 0
}) => {
  const tabs = [
    { id: 'dashboard', icon: Icons.Home, label: 'Command' },
    { id: 'schedule', icon: Icons.Calendar, label: 'Schedule' },
    { id: 'messages', icon: Icons.MessageSquare, label: 'Comms', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'requests', icon: Icons.Briefcase, label: 'Requests', badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
    { id: 'studio', icon: Icons.Camera, label: 'Studio' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-3xl border-t border-gray-100/50 px-4 py-3 pb-8 z-40 rounded-t-[32px] shadow-[0_-15px_50px_-15px_rgba(0,0,0,0.12)]">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onTabChange(tab.id);
              }}
              className="relative flex flex-col items-center group outline-none"
            >
              {/* Top accent line */}
              {isActive && (
                <motion.div
                  layoutId="photographer-nav-indicator-line"
                  className="absolute -top-3.5 w-8 h-1 bg-brand-DEFAULT rounded-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              
              <div className="relative w-12 h-12 flex items-center justify-center mb-1">
                {/* Flowing background pill that slides between tabs */}
                {isActive && (
                  <motion.div
                    layoutId="photographer-active-pill"
                    className="absolute inset-0 gradient-border-mask p-[2px] rounded-2xl shadow-lg shadow-brand-DEFAULT/20"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                  >
                    <div className="w-full h-full bg-brand-DEFAULT rounded-[14px]" />
                  </motion.div>
                )}
                
                {/* Icon with color transition */}
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? '#111827' : '#9CA3AF'
                  }}
                  className="relative z-10"
                >
                  <tab.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  {tab.badge ? (
                    <div className="absolute -top-1 -right-1 bg-brand-DEFAULT text-[8px] font-black text-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {tab.badge}
                    </div>
                  ) : null}
                </motion.div>
              </div>

              {/* Label with flowing gradient text */}
              <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-light via-brand-DEFAULT to-accent-DEFAULT bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto] opacity-100' 
                  : 'opacity-40 text-gray-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
