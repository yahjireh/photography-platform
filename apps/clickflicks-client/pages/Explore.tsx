import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import PhotographerCard from '../components/PhotographerCard';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotographers } from '../hooks/usePhotographers';
import { PhotographerCardSkeleton } from '../components/SkeletonLoader';

interface ExploreProps {
  initialFilter?: string;
  onPhotographerClick: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const Explore: React.FC<ExploreProps> = ({ 
  initialFilter = 'All',
  onPhotographerClick,
  favorites,
  onToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'none'>('none');
  const { photographers, isLoading } = usePhotographers(activeFilter);

  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  const filteredPhotographers = photographers.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
                          p.name.toLowerCase().includes(term) || 
                          p.location.toLowerCase().includes(term) ||
                          p.category.toLowerCase().includes(term) ||
                          (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(term)));
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'price-low') return (a.hourlyRate || a.startingPrice || 0) - (b.hourlyRate || b.startingPrice || 0);
    if (sortBy === 'price-high') return (b.hourlyRate || b.startingPrice || 0) - (a.hourlyRate || a.startingPrice || 0);
    return 0;
  });

  return (
    <div className="pb-32 pt-6 px-4">
      <h1 className="text-3xl font-serif font-black italic mb-8 px-2 text-gray-900">Explore</h1>
      
      {/* Search Bar */}
      <div className="relative mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search masters, studios, locations..."
          className="w-full bg-white border border-gray-100 text-gray-900 placeholder-gray-400 py-5 pl-14 pr-12 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-DEFAULT/20 transition-all font-bold text-sm"
        />
        <Icons.Search className="absolute left-5 top-5 text-gray-400" size={20} strokeWidth={2} />
        <button 
          onClick={() => setShowFilterDrawer(true)}
          className="absolute right-4 top-4 p-1.5 bg-gray-50 rounded-xl text-gray-900 hover:bg-gray-100 transition-colors"
        >
            <Icons.Filter size={18} />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex space-x-3 overflow-x-auto no-scrollbar mb-8 pb-2">
        <button
          onClick={() => setActiveFilter('All')}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
            activeFilter === 'All' 
              ? 'bg-gray-900 text-gray-200 shadow-lg' 
              : 'bg-white border border-gray-100 text-gray-400'
          }`}
        >
          All Masters
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.name)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              activeFilter === cat.name 
                ? 'bg-gray-900 text-gray-200 shadow-lg' 
                : 'bg-white border border-gray-100 text-gray-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid with Skeleton loading */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <>
            <PhotographerCardSkeleton compact={false} />
            <PhotographerCardSkeleton compact={false} />
            <PhotographerCardSkeleton compact={false} />
          </>
        ) : filteredPhotographers.length > 0 ? (
          filteredPhotographers.map((p) => (
            <PhotographerCard 
              key={p.id} 
              data={p} 
              onClick={() => onPhotographerClick(p.id)} 
              isFavorite={favorites.includes(p.id)}
              onToggleFavorite={() => onToggleFavorite(p.id)}
            />
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.Search size={32} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-900 text-sm font-bold uppercase tracking-wider mb-2">No Matching Artists</p>
            <p className="text-gray-400 text-xs font-medium">Try broadening your search term or selecting another category.</p>
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {showFilterDrawer && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilterDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-8">Sort & Filter</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Sort By Performance</p>
                  <div className="grid grid-cols-1 gap-3">
                    <SortOption active={sortBy === 'rating'} label="Highest Rated First" onClick={() => setSortBy('rating')} />
                    <SortOption active={sortBy === 'price-low'} label="Most Competitive Pricing" onClick={() => setSortBy('price-low')} />
                    <SortOption active={sortBy === 'price-high'} label="Premium/Tiered First" onClick={() => setSortBy('price-high')} />
                    <SortOption active={sortBy === 'none'} label="Reset Order" onClick={() => setSortBy('none')} />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowFilterDrawer(false)}
                className="w-full mt-10 bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Apply Preferences
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SortOption: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between ${
      active ? 'bg-brand-DEFAULT/5 border-brand-DEFAULT text-brand-DEFAULT' : 'bg-gray-50 border-gray-100 text-gray-600'
    }`}
  >
    <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
    {active && <Icons.Check size={16} />}
  </button>
);

export default Explore;
