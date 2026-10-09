import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/icons';

const Loading: React.FC = () => {
  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-32 -right-32 w-96 h-96 bg-brand-light opacity-10 rounded-full blur-3xl" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-dark opacity-20 rounded-full blur-3xl" 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center z-10 px-8 text-center"
      >
        <div className="mb-6 p-4 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl flex items-center justify-center">
          <img 
            src="./logo-white.png" 
            alt="ClickFlicks Creator Studio" 
            className="w-60 max-w-[280px] object-contain drop-shadow-xl"
          />
        </div>
        
        <p className="text-brand-light text-xs tracking-widest uppercase font-bold">Creator Studio Command</p>
      </motion.div>

      <div className="absolute bottom-12">
        <Icons.Loader2 className="w-8 h-8 text-brand-light/60 animate-spin" />
      </div>
    </div>
  );
};

export default Loading;
