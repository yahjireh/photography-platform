import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';

interface WelcomeProps {
  onGetStarted: () => void;
}

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1200&auto=format&fit=crop",
    text: "Cherish Timeless Ghanaian Celebrations",
    highlight: "Ghanaian Celebrations"
  },
  {
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop",
    text: "Capture African Elegance With Perfection",
    highlight: "African Elegance"
  },
  {
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    text: "Discover Elite Creators In Accra & Beyond",
    highlight: "Elite Creators"
  }
];

const KenteAccentRibbon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full h-1.5 flex overflow-hidden rounded-full shadow-sm ${className}`}>
    <div className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500" />
    <div className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500" />
    <div className="flex-1 bg-gradient-to-r from-red-600 to-amber-600" />
    <div className="flex-1 bg-gradient-to-r from-amber-500 to-emerald-600" />
    <div className="flex-1 bg-gradient-to-r from-emerald-700 to-red-600" />
    <div className="flex-1 bg-gradient-to-r from-amber-600 to-amber-400" />
    <div className="flex-1 bg-gradient-to-r from-emerald-600 to-amber-500" />
  </div>
);

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000); 
    return () => clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[index];

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex flex-col justify-end">
      
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={index}
            src={currentSlide.image}
            alt="Background"
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
      </div>

      <div className="relative z-10 px-8 pb-14 w-full">
        
        {/* Subtle Indigenous Ghana Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Ghana's Premier Photography Platform</span>
          </div>
        </motion.div>

        <div className="mb-10 min-h-[150px] flex items-end">
            <AnimatePresence mode="wait">
                <AnimatedTitle 
                    key={index}
                    text={currentSlide.text}
                    highlight={currentSlide.highlight}
                />
            </AnimatePresence>
        </div>

        {/* Subtle Kente Geometric Accent Ribbon */}
        <KenteAccentRibbon className="mb-6 opacity-85" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <button
            onClick={onGetStarted}
            className="group w-full relative overflow-hidden rounded-[24px] p-[1px] shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-amber-600/30 backdrop-blur-2xl transition-all group-hover:scale-110" />
            <div className="relative flex items-center justify-center space-x-3 py-5 px-8 text-gray-100 border border-white/10 rounded-[23px] bg-black/40 group-hover:bg-black/20 transition-all">
                <span className="font-bold text-sm uppercase tracking-[0.2em] text-white">Enter Studio</span>
                <Icons.ArrowRight size={18} className="text-amber-400 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-gray-400 text-[9px] mt-6 font-black uppercase tracking-[0.4em]"
        >
          ClickFlicks Studio • Accra, Ghana © 2026
        </motion.p>
      </div>
    </div>
  );
};

const AnimatedTitle: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    let globalWordIndex = 0;
    
    return (
        <h1 className="text-4xl md:text-5xl font-serif font-black text-gray-200 leading-[1.1] tracking-tighter uppercase italic">
            {parts.map((part, partIndex) => {
                const isHighlight = part.toLowerCase() === highlight.toLowerCase();
                const words = part.split(' ').filter(w => w.length > 0);

                return words.map((word, wordIndex) => {
                    const delay = globalWordIndex * 0.1;
                    globalWordIndex++;
                    
                    return (
                        <React.Fragment key={`${partIndex}-${wordIndex}`}>
                            <span className="inline-block overflow-hidden align-top py-1">
                                <motion.span
                                    className={`inline-block relative ${isHighlight ? 'text-brand-light pr-2' : 'mr-2'}`}
                                    initial={{ y: "110%", opacity: 0 }}
                                    animate={{ y: "0%", opacity: 1 }}
                                    exit={{ y: "-110%", opacity: 0, transition: { duration: 0.4 } }}
                                    transition={{ 
                                        duration: 0.8, 
                                        ease: [0.16, 1, 0.3, 1],
                                        delay: delay * 0.1
                                    }}
                                >
                                    {word}
                                </motion.span>
                            </span>
                            {!isHighlight && " "}
                        </React.Fragment>
                    );
                });
            })}
        </h1>
    );
};

export default Welcome;
