import React from 'react';
import { Photographer } from '../types';
import { Icons } from './ui/icons';

interface PhotographerCardProps {
  data: Photographer;
  onClick: (photographer?: Photographer) => void;
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

  const initials = data.name
    ? data.name.trim().split(/\s+/).map(n => n[0] || '').join('').slice(0, 2).toUpperCase() || 'PH'
    : 'PH';

  const hasHourlyRate = data.hourlyRate != null && Number(data.hourlyRate) > 0;
  const hasStartingPrice = data.startingPrice != null && Number(data.startingPrice) > 0;
  const hasDayRate = data.dayRate != null && Number(data.dayRate) > 0;
  const hasRating = data.rating != null && Number(data.rating) > 0;

  return (
    <div 
      onClick={() => onClick(data)}
      className={`group bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/50 active:scale-95 transition-all duration-300 cursor-pointer ${compact ? 'min-w-[200px] w-[200px]' : 'w-full mb-6'}`}
    >
      <div className={`relative ${compact ? 'h-48' : 'h-64'} overflow-hidden bg-gray-900`}>
        {data.imageUrl ? (
          <img 
            src={data.imageUrl} 
            alt={data.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex flex-col items-center justify-center text-gray-400 p-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-light mb-2 shadow-inner">
              <span className="text-lg font-serif font-black italic">{initials}</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Master Artist</span>
          </div>
        )}
        
        {/* Floating Action Area */}
        <div className="absolute top-3 left-3 flex items-center space-x-2 z-20">
          {/* Favorite Button */}
          <button 
            onClick={handleFavoriteClick}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all active:scale-90 ${
              isFavorite 
                ? 'bg-brand-DEFAULT border-brand-light text-gray-200 shadow-lg shadow-brand-DEFAULT/30' 
                : 'bg-black/40 border-white/20 text-gray-300 hover:bg-black/60'
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
            <div className="bg-brand-DEFAULT text-white p-1.5 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Icons.ShieldCheck size={14} />
            </div>
          )}
        </div>

        {/* Glassmorphic Rating Tag */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center space-x-1.5 border border-white/20 z-20">
          {hasRating ? (
            <>
              <Icons.Star size={12} className="text-yellow-500 fill-current" />
              <span className="text-[10px] font-black text-gray-200">{Number(data.rating).toFixed(1)}</span>
            </>
          ) : (
            <>
              <Icons.Sparkles size={11} className="text-brand-light" />
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-200">New</span>
            </>
          )}
        </div>

        {/* Pricing Overlay for non-compact - Shows Day Rate if available, else blank */}
        {!compact && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
             <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">{data.category}</span>
                {hasDayRate && (
                  <p className="text-gray-200 font-serif font-black text-xl italic leading-none">
                    ₵{data.dayRate}<span className="text-[10px] font-sans font-bold uppercase not-italic opacity-70 ml-1">/day</span>
                  </p>
                )}
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
        
        <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-2 mb-3">
          <Icons.MapPin size={12} className="mr-1 text-brand-DEFAULT shrink-0" />
          <span className="truncate">{data.location}</span>
        </div>

        {!compact && data.about && (
            <p className="text-xs text-gray-600 mb-5 line-clamp-2 leading-relaxed font-medium">
                {data.about}
            </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          {hasHourlyRate ? (
             <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Hourly Rate</span>
                <p className="text-gray-900 font-serif font-black text-lg leading-none">
                  ₵{data.hourlyRate}
                  <span className="text-[10px] font-sans font-medium text-gray-500 ml-0.5">/hr</span>
                </p>
             </div>
          ) : hasStartingPrice ? (
             <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Starting From</span>
                <p className="text-gray-900 font-serif font-black text-lg leading-none">
                  ₵{data.startingPrice}
                </p>
             </div>
          ) : hasDayRate ? (
             <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Day Rate</span>
                <p className="text-gray-900 font-serif font-black text-lg leading-none">
                  ₵{data.dayRate}
                  <span className="text-[10px] font-sans font-medium text-gray-500 ml-0.5">/day</span>
                </p>
             </div>
          ) : (
             <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Rate</span>
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">On Request</span>
             </div>
          )}
          
          <button className={`bg-gray-900 text-gray-200 rounded-2xl flex items-center justify-center transition-all active:scale-90 hover:bg-brand-DEFAULT ${compact ? 'w-10 h-10' : 'px-5 py-2.5 space-x-2'}`}>
            <span className={compact ? 'hidden' : 'text-xs font-bold uppercase tracking-widest'}>Reserve</span>
            <Icons.ArrowRight size={compact ? 16 : 14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotographerCard;
