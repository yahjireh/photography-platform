import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/icons';

interface LauncherProps {
  onLaunch: (app: 'client' | 'photographer') => void;
}

const Launcher: React.FC<LauncherProps> = ({ onLaunch }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden flex flex-col items-center pt-20">
      {/* Dynamic Wallpaper */}
      <div className="absolute inset-0 z-0">
         <img 
            src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=1000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-60 scale-110" 
            alt="Wallpaper"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Clock Widget */}
      <div className="relative z-10 flex flex-col items-center mb-24">
         <h1 className="text-7xl font-sans font-thin text-white tracking-tighter opacity-90">
           {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
         </h1>
         <p className="text-white/80 font-medium text-lg tracking-wide uppercase mt-1">
           {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
         </p>
      </div>

      {/* App Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-x-12 gap-y-10">
         {/* Client App Icon */}
         <div className="flex flex-col items-center space-y-3 group">
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => onLaunch('client')}
              className="w-20 h-20 bg-white rounded-[22px] flex items-center justify-center shadow-2xl shadow-black/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100" />
              <Icons.Camera size={40} className="text-gray-900 relative z-10" strokeWidth={1.5} />
            </motion.button>
            <span className="text-white text-xs font-medium tracking-wide drop-shadow-md">LensCreate</span>
         </div>

         {/* Photographer App Icon */}
         <div className="flex flex-col items-center space-y-3 group">
            <motion.button 
              whileTap={{ scale: 0.85 }}
              onClick={() => onLaunch('photographer')}
              className="w-20 h-20 bg-gray-900 rounded-[22px] flex items-center justify-center shadow-2xl shadow-black/30 relative overflow-hidden border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
              <Icons.Aperture size={40} className="text-brand-light relative z-10" strokeWidth={1.5} />
            </motion.button>
            <span className="text-white text-xs font-medium tracking-wide drop-shadow-md">Studio</span>
         </div>
      </div>

      {/* Dock Area Simulation */}
      <div className="mt-auto mb-6 w-[90%] h-24 bg-white/10 backdrop-blur-2xl rounded-[35px] mx-auto border border-white/10 flex items-center justify-around px-2">
         <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg"><Icons.Phone className="text-white" size={28} /></div>
         <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><Icons.Mail className="text-white" size={28} /></div>
         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg"><Icons.Chrome className="text-gray-900" size={28} /></div>
         <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg"><Icons.Music className="text-white" size={28} /></div>
      </div>
    </div>
  );
};

// Adding Icons specifically for the launcher that might not be in the main set
// Assuming standard Lucide icons are available via the existing import, 
// I'll augment Icons in the main file if needed, but for now relying on ui/icons.
// To ensure they exist, I will add them to ui/icons.tsx in a separate change block.

export default Launcher;