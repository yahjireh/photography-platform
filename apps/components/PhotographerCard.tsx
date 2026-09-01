import React from 'react';
import { Photographer } from '../types';
import { Icons } from './ui/icons';

interface PhotographerCardProps {
  data: Photographer;
  onClick: () => void;
  compact?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const PhotographerCard: React.FC<PhotographerCardProps> = ({ 
  data, 
  onClick, 
  compact = false,
  isFavorite = false,
  onToggleFavorite
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  return (
    <div 
      onClick={onClick}
      className={`group bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50 active:scale-95 transition-all duration-300 ${compact ? 'min-w-[200px] w-[200px]' : 'w-full mb-6'}`}
    >
      <div className={`relative ${compact ? 'h-48' : 'h-64'} overflow-hidden`}>
        <img 
          src={data.imageUrl} 
          alt={data.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Floating Action Area */}
        <div className="absolute top-3 left-3 flex items-center space-x-2 z-20">
          {/* Favorite Button */}
          <button 
            onClick={handleFavoriteClick}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all active:scale-90 ${
              isFavorite 
                ? 'bg-brand-DEFAULT border-brand-light text-gray-200 shadow-lg shadow-brand-DEFAULT/30' 
                : 'bg-black/20 border-white/20 text-gray-300 hover:bg-black/40'
            }`}
          >
            <Icons.Heart 
              size={14} 
              className={isFavorite ? 'fill-current' : ''} 
              strokeWidth={2.5} 
            />
          </button>

          {/* Verified Badge */}
          {data.verified && (
            <div className="bg-brand-DEFAULT text-brand-light p-1.5 rounded-xl shadow-lg backdrop-blur-sm border border-white/20">
              <Icons.ShieldCheck size={14} />
            </div>
          )}
        </div>

        {/* Glassmorphic Rating Tag */}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1.5 border border-white/20">
          <Icons.Star size={12} className="text-yellow-500 fill-current" />
          <span className="text-[10px] font-black text-gray-200">{data.rating}</span>
        </div>

        {/* Pricing Overlay for non-compact */}
        {!compact && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
             <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">{data.category}</span>
                <p className="text-gray-200 font-serif font-black text-xl italic leading-none">
                  ₵{data.hourlyRate}<span className="text-[10px] font-sans font-bold uppercase not-italic opacity-60 ml-1">/hr</span>
                </p>
             </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-white">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className={`font-serif font-black text-gray-900 leading-none ${compact ? 'text-lg' : 'text-2xl'} mb-1`}>
              {data.name}
            </h3>
            {compact && <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">{data.category}</p>}
          </div>
        </div>
        
        <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-2 mb-4">
          <Icons.MapPin size={12} className="mr-1 text-brand-DEFAULT" />
          <span className="truncate">{data.location}</span>
        </div>

        {!compact && (
            <p className="text-xs text-gray-600 mb-6 line-clamp-2 leading-relaxed font-medium">
                {data.about}
            </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          {compact ? (
             <p className="text-gray-900 font-serif font-black text-lg">
                ₵{data.hourlyRate}
             </p>
          ) : (
            <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" />
                    </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-light flex items-center justify-center text-[8px] font-bold text-brand-dark">
                    +9
                </div>
            </div>
          )}
          
          <button className={`bg-gray-900 text-gray-200 rounded-2xl flex items-center justify-center transition-all active:scale-90 hover:bg-brand-DEFAULT ${compact ? 'w-10 h-10' : 'px-6 py-3 space-x-2'}`}>
            <span className={compact ? 'hidden' : 'text-xs font-bold uppercase tracking-widest'}>Reserve</span>
            <Icons.ArrowRight size={compact ? 18 : 14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotographerCard;