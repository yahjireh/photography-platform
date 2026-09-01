import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/icons';

const Loading: React.FC = () => {
  return (
    <div className="h-full w-full bg-brand-DEFAULT flex flex-col items-center justify-center relative overflow-hidden">
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
        className="absolute -top-32 -right-32 w-96 h-96 bg-brand-light opacity-20 rounded-full blur-3xl" 
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
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-dark opacity-30 rounded-full blur-3xl" 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center z-10"
      >
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
          <Icons.Camera className="text-brand-DEFAULT w-12 h-12" strokeWidth={2} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-100 tracking-tight mb-2">ClickFlicks</h1>
        <p className="text-brand-light text-sm tracking-widest uppercase">Photography Marketplace</p>
      </motion.div>

      <div className="absolute bottom-12">
        <Icons.Loader2 className="w-8 h-8 text-gray-100/50 animate-spin" />
      </div>
    </div>
  );
};

export default Loading;
