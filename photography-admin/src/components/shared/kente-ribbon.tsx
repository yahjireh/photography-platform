import React from 'react';
import { cn } from '@/lib/utils';

interface KenteRibbonProps {
  className?: string;
  height?: string;
  opacity?: number;
}

/**
 * Authentic Indigenous Ghanaian Kente woven ribbon accent
 * Can be placed at the top of cards, widgets, and modal headers
 */
export function KenteRibbon({ 
  className, 
  height = '3px',
  opacity = 90 
}: KenteRibbonProps) {
  return (
    <div 
      className={cn("absolute top-0 left-0 right-0 pointer-events-none z-10", className)}
      style={{
        height,
        opacity: opacity / 100,
        background: 'repeating-linear-gradient(90deg, #D4AF37 0px, #D4AF37 14px, #059669 14px, #059669 28px, #DC2626 28px, #DC2626 42px, #0B0F17 42px, #0B0F17 56px, #F59E0B 56px, #F59E0B 70px)'
      }}
    />
  );
}

export default KenteRibbon;
