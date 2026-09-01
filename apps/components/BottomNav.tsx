import React from 'react';
import { Icons } from './ui/icons';
import { motion } from 'framer-motion';
import { UserType } from '../types';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userType?: UserType;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, userType = UserType.CLIENT }) => {
  const clientTabs = [
    { id: 'home', icon: Icons.Home, label: 'Home' },
    { id: 'explore', icon: Icons.Search, label: 'Explore' },
    { id: 'messages', icon: Icons.MessageSquare, label: 'Messages', badge: 2 },
    { id: 'bookings', icon: Icons.Calendar, label: 'Booking' },
    { id: 'profile', icon: Icons.User, label: 'Vault' },
  ];

  const photographerTabs = [
    { id: 'dashboard', icon: Icons.Home, label: 'Command' },
    { id: 'schedule', icon: Icons.Calendar, label: 'Schedule' },
    { id: 'messages', icon: Icons.MessageSquare, label: 'Comms', badge: 5 },
    { id: 'requests', icon: Icons.Briefcase, label: 'Requests', badge: 3 },
    { id: 'studio', icon: Icons.Camera, label: 'Studio' },
  ];

  const tabs = userType === UserType.PHOTOGRAPHER ? photographerTabs : clientTabs;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-3xl border-t border-gray-100/50 px-4 py-3 pb-8 z-40 rounded-t-[32px] shadow-[0_-15px_50px_-15px_rgba(0,0,0,0.12)]">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center group outline-none"
            >
              {/* Top accent line */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator-line"
                  className="absolute -top-3.5 w-8 h-1 bg-brand-DEFAULT rounded-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              
              <div className="relative w-12 h-12 flex items-center justify-center mb-1">
                {/* Flowing background pill that slides between tabs */}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
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
                    color: isActive ? '#E5E7EB' : '#9CA3AF'
                  }}
                  className="relative z-10"
                >
                  <tab.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  {tab.badge ? (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black text-gray-100 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
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