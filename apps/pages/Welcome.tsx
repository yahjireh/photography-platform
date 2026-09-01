import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';

interface WelcomeProps {
  onGetStarted: () => void;
}

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop",
    text: "Leave Memory Lapses Behind For Good",
    highlight: "Memory Lapses"
  },
  {
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
    text: "Capture Every Detail With Perfection",
    highlight: "Every Detail"
  },
  {
    image: "https://images.unsplash.com/photo-1554048612-387768052bf7?q=80&w=1000&auto=format&fit=crop",
    text: "Find Top Talent In Your City",
    highlight: "Top Talent"
  }
];

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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
      </div>

      <div className="relative z-10 px-8 pb-14 w-full">
        
        <div className="mb-14 min-h-[160px] flex items-end">
            <AnimatePresence mode="wait">
                <AnimatedTitle 
                    key={index}
                    text={currentSlide.text}
                    highlight={currentSlide.highlight}
                />
            </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <button
            onClick={onGetStarted}
            className="group w-full relative overflow-hidden rounded-[24px] p-[1px] shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-light/20 to-brand-DEFAULT/20 backdrop-blur-2xl transition-all group-hover:scale-110" />
            <div className="relative flex items-center justify-center space-x-3 py-5 px-8 text-gray-100 border border-white/10 rounded-[23px]">
                <span className="font-bold text-sm uppercase tracking-[0.2em]">Enter Studio</span>
                <Icons.ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-gray-500 text-[9px] mt-8 font-black uppercase tracking-[0.4em]"
        >
          LensCreate Studio © 2026
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