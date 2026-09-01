import React from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  fullScreen?: boolean;
  onHome?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav, fullScreen = false, onHome }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Mobile Simulator Container */}
      <div className={`w-full h-full max-w-[480px] h-screen max-h-screen flex flex-col relative shadow-2xl overflow-hidden sm:rounded-[30px] sm:h-[90vh] sm:border-[8px] sm:border-gray-900 ${fullScreen ? 'bg-black' : 'bg-gray-50'}`}>
        
        {/* Notch simulation for desktop view */}
        <div className="hidden sm:block absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-6 bg-gray-900 rounded-b-xl z-[60]"></div>

        <main className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth ${fullScreen ? '' : 'pb-20'}`}>
          {children}
        </main>

        {/* Home Indicator Gesture */}
        {onHome && (
          <div className="absolute bottom-0 left-0 right-0 h-6 z-[100] flex items-center justify-center pointer-events-none">
            <motion.button 
              onClick={onHome}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
              whileTap={{ scale: 0.9 }}
              className="w-32 h-1.5 bg-gray-300/50 backdrop-blur-md rounded-full pointer-events-auto hover:bg-white transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
