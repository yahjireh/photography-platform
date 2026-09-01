import React from 'react';
import { motion } from 'framer-motion';

interface ApertureTransitionProps {
  state: 'idle' | 'closing' | 'opening';
}

const ApertureTransition: React.FC<ApertureTransitionProps> = ({ state }) => {
  if (state === 'idle') return null;

  const bladeCount = 12;
  const blades = Array.from({ length: bladeCount }).map((_, i) => i * (360 / bladeCount));
  
  const duration = 0.9;
  const ease = [0.16, 1, 0.3, 1] as const;

  const openDistance = "160vmax"; 
  const closedDistance = "0vmax"; 

  const bladeVariants = {
    initial: { y: openDistance, rotate: 0 },
    closing: { 
      y: closedDistance,
      rotate: 15,
      transition: { duration: duration, ease: ease } 
    },
    opening: { 
      y: openDistance,
      rotate: 0,
      transition: { duration: duration, ease: ease } 
    }
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    closing: { opacity: 1, transition: { delay: duration * 0.4, duration: 0.2 } },
    opening: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="absolute inset-0 z-[100] overflow-hidden pointer-events-none flex items-center justify-center bg-transparent">
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        initial="initial"
        animate={state}
      >
        {blades.map((angle, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-0 h-0"
            style={{ 
                transform: `rotate(${angle}deg)` 
            }}
          >
            <motion.div
                className="absolute bg-[#050505]"
                style={{
                    top: 0, 
                    left: '-120vmax', 
                    width: '240vmax',
                    height: '240vmax',
                    clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 20%)',
                    border: '1px solid rgba(255,255,255,0.02)'
                }}
                variants={bladeVariants}
            />
          </div>
        ))}
      </motion.div>

      <motion.div 
        className="absolute inset-0 bg-black z-10"
        variants={overlayVariants}
        initial="initial"
        animate={state}
      />
    </div>
  );
};

export default ApertureTransition;
