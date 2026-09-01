import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../components/ui/icons';
import { UserType } from '../types';

interface OnboardingProps {
  onComplete: () => void;
  userType?: UserType;
}

const CLIENT_SLIDES = [
  {
    id: 0,
    title: "Find Top Talent",
    description: "Connect with the best photographers in Ghana for any occasion.",
    image: "https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 1,
    title: "Secure Booking",
    description: "Hassle-free scheduling and secure verified payments.",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Capture Memories",
    description: "Get high-quality photos delivered directly to you.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop"
  }
];

const PHOTOGRAPHER_SLIDES = [
  {
    id: 0,
    title: "Curate Your Legacy",
    description: "Build a stunning portfolio that defines your artistic signature.",
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 1,
    title: "Command Center",
    description: "Manage high-value bookings and schedules with precision tools.",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Global Reach",
    description: "Connect with premium clients and grow your studio business.",
    image: "https://images.unsplash.com/photo-1554048612-387768052bf7?q=80&w=1000&auto=format&fit=crop"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userType = UserType.CLIENT }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = userType === UserType.PHOTOGRAPHER ? PHOTOGRAPHER_SLIDES : CLIENT_SLIDES;
  const currentSlideData = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-black text-white">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
            <motion.img 
                key={currentSlide}
                src={currentSlideData.image}
                alt=""
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 z-10" />
      </div>

      {/* Top Bar */}
      <div className="relative z-20 pt-12 px-6 flex justify-between items-center">
         <div className="flex space-x-1.5">
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} 
                />
            ))}
         </div>
         <button onClick={onComplete} className="text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors">Skip</button>
      </div>

      {/* Content Area */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-8 pb-12">
         <AnimatePresence mode="wait">
            <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-10"
            >
                <h1 className="text-5xl font-serif font-black italic mb-4 leading-tight tracking-tight">
                    {currentSlideData.title.split(' ').map((word, i) => (
                        <span key={i} className={i === 1 ? 'text-brand-light block' : 'block'}>{word}</span>
                    ))}
                </h1>
                <p className="text-gray-300 font-medium text-sm leading-relaxed max-w-[90%]">
                    {currentSlideData.description}
                </p>
            </motion.div>
         </AnimatePresence>

         <button 
            onClick={handleNext}
            className="w-full bg-white text-black py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:bg-brand-light transition-colors active:scale-95"
         >
            <span>{currentSlide === slides.length - 1 ? 'Enter Studio' : 'Next Step'}</span>
            <Icons.ArrowRight size={16} />
         </button>
      </div>
    </div>
  );
};

export default Onboarding;