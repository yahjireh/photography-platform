import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import PhotographerCard from '../components/PhotographerCard';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotographers } from '../hooks/usePhotographers';
import { useAuth } from '../hooks/useAuth';
import { PhotographerCardSkeleton } from '../components/SkeletonLoader';

interface HomeProps {
  onPhotographerClick: (id: string) => void;
  onSearchFocus: () => void;
  onCategoryClick: (name: string) => void;
  onGeminiClick: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ 
  onPhotographerClick, 
  onSearchFocus, 
  onCategoryClick,
  onGeminiClick,
  favorites,
  onToggleFavorite
}) => {
  const { photographers, isLoading } = usePhotographers();
  const { user } = useAuth();
  const [isSortedByRating, setIsSortedByRating] = React.useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const displayedPhotographers = isSortedByRating 
    ? [...photographers].sort((a, b) => b.rating - a.rating)
    : photographers;

  return (
    <div className="pb-24 bg-gray-50/50 min-h-screen relative">
      {/* Premium Header */}
      <header className="relative pt-16 pb-16 px-6 overflow-hidden">
        {/* Animated Background Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-light/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute top-20 left-0 -ml-20 w-60 h-60 bg-accent-DEFAULT/10 rounded-full blur-[60px]" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-2">Ghanaian Visual Arts</p>
              <h1 className="text-4xl font-serif font-black text-gray-900 tracking-tight leading-none italic">
                Good Day, <br />
                <span className="text-brand-DEFAULT not-italic">{user?.first_name || 'Artisan'}</span>
              </h1>
            </motion.div>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-black/5 flex items-center justify-center border border-gray-100 overflow-hidden"
            >
              {user?.profile_image_url ? (
                <img 
                  src={user.profile_image_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 text-brand-light flex items-center justify-center font-serif font-bold text-sm">
                  {user?.first_name ? user.first_name[0].toUpperCase() : 'KA'}
                </div>
              )}
            </motion.button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative cursor-pointer"
            onClick={onSearchFocus}
          >
            {/* Outer Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-light via-brand-DEFAULT to-accent-DEFAULT rounded-2xl blur opacity-15 transition duration-500 animate-gradient-flow" />
            
            <div className="relative flex items-center h-16 bg-white border border-gray-200 rounded-2xl shadow-sm pl-14 pr-4">
              {/* Search Icon */}
              <div className="absolute left-5 z-20 pointer-events-none flex items-center justify-center">
                <Icons.Search className="text-gray-400" size={22} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                readOnly
                placeholder="Find a master of light..."
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none font-bold text-sm cursor-pointer"
                onClick={onSearchFocus}
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Elegant Categories */}
      <section className="mt-2 px-6">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">Curated Categories</h2>
          <button 
            onClick={() => setShowAllCategories(true)}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark border-b-2 border-brand-dark/20 pb-1"
          >
            View All
          </button>
        </div>
        <div className="flex space-x-6 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
          {CATEGORIES.map((cat, idx) => (
            <motion.div 
              key={cat.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center space-y-3 min-w-[84px]"
            >
              <button 
                onClick={() => onCategoryClick(cat.name)}
                className="gradient-border-mask group active:scale-90 transition-all duration-300 shadow-md shadow-black/5"
              >
                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-[15px] transition-colors">
                  <div className="text-gray-400 group-hover:scale-110 transition-transform flex items-center justify-center">
                    {cat.id === 'wedding' && <Icons.Heart size={26} strokeWidth={1.5} />}
                    {cat.id === 'corporate' && <Icons.Briefcase size={26} strokeWidth={1.5} />}
                    {cat.id === 'fashion' && <Icons.Shirt size={26} strokeWidth={1.5} />}
                    {cat.id === 'portrait' && <Icons.User size={26} strokeWidth={1.5} />}
                    {cat.id === 'events' && <Icons.Calendar size={26} strokeWidth={1.5} />}
                    {cat.id === 'product' && <Icons.Package size={26} strokeWidth={1.5} />}
                    {cat.id === 'mobile' && <Icons.Smartphone size={26} strokeWidth={1.5} />}
                    {cat.id === 'photojournalism' && <Icons.Newspaper size={26} strokeWidth={1.5} />}
                    {cat.id === 'videography' && <Icons.Video size={26} strokeWidth={1.5} />}
                  </div>
                </div>
              </button>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">{cat.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Masters Section */}
      <section className="mt-10 px-6">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">Top Rated</h2>
            <div className="h-1 w-8 bg-accent-DEFAULT rounded-full" />
          </div>
          <button 
            onClick={() => setIsSortedByRating(!isSortedByRating)}
            className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isSortedByRating ? 'text-gray-900 underline' : 'text-gray-400'}`}
          >
            {isSortedByRating ? 'Sorted By Rating' : 'Sort By Rating'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex space-x-5 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
            {[1, 2, 3].map(i => (
              <PhotographerCardSkeleton key={i} compact={true} />
            ))}
          </div>
        ) : displayedPhotographers.length > 0 ? (
          <div className="flex space-x-5 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
            {displayedPhotographers.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, type: "spring", damping: 20 }}
                viewport={{ once: true }}
              >
                <PhotographerCard 
                  data={p} 
                  compact={true} 
                  onClick={() => onPhotographerClick(p.id)} 
                  isFavorite={favorites.includes(p.id)}
                  onToggleFavorite={() => onToggleFavorite(p.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white rounded-3xl border border-gray-100 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No verified photographers found</p>
          </div>
        )}
      </section>

      {/* Discovery Feed */}
      <section className="mt-4 px-6 mb-12">
        <div className="flex items-center space-x-3 mb-8">
            <div className="bg-brand-DEFAULT p-1.5 rounded-lg text-gray-900">
                <Icons.Sparkles size={16} />
            </div>
            <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">Recent Discovery</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2].map(i => (
              <PhotographerCardSkeleton key={i} compact={false} />
            ))}
          </div>
        ) : displayedPhotographers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {displayedPhotographers.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <PhotographerCard 
                  data={p} 
                  onClick={() => onPhotographerClick(p.id)} 
                  isFavorite={favorites.includes(p.id)}
                  onToggleFavorite={() => onToggleFavorite(p.id)}
                />
              </motion.div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Floating Gemini AI FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onGeminiClick}
        className="fixed bottom-32 right-6 w-14 h-14 bg-gray-900 text-gray-200 rounded-full shadow-2xl flex items-center justify-center z-50 border-2 border-brand-DEFAULT/30"
      >
        <Icons.Sparkles size={24} className="text-brand-light" />
      </motion.button>

      {/* Floating Concierge Invite */}
      <div 
        onClick={onGeminiClick}
        className="mx-6 mb-6 p-6 rounded-3xl bg-gray-900 text-gray-200 relative overflow-hidden group active:scale-[0.98] transition-all shadow-xl shadow-black/10 cursor-pointer"
      >
         <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-light opacity-20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
         <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-200">Smart Match</p>
                <h3 className="text-xl font-serif font-bold text-gray-200">Try AI Concierge</h3>
                <p className="text-xs text-gray-400">Let Gemini find your perfect match.</p>
            </div>
            <div className="w-12 h-12 bg-gray-100/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-gray-100/10 group-hover:bg-brand-DEFAULT transition-colors">
                <Icons.ArrowRight size={20} className="text-gray-200" />
            </div>
         </div>
      </div>

      {/* Categories Modal */}
      <AnimatePresence>
        {showAllCategories && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAllCategories(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-3/4 max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-serif font-black italic text-gray-900">All Categories</h3>
                <button onClick={() => setShowAllCategories(false)} className="p-2 bg-gray-50 rounded-full text-gray-900"><Icons.X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {CATEGORIES.map((cat, idx) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      onCategoryClick(cat.name);
                      setShowAllCategories(false);
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-brand-DEFAULT/5 hover:border-brand-DEFAULT transition-all group"
                  >
                    <div className="text-gray-400 group-hover:text-brand-DEFAULT transition-colors mb-3">
                      {cat.id === 'wedding' && <Icons.Heart size={32} strokeWidth={1.5} />}
                      {cat.id === 'corporate' && <Icons.Briefcase size={32} strokeWidth={1.5} />}
                      {cat.id === 'fashion' && <Icons.Shirt size={32} strokeWidth={1.5} />}
                      {cat.id === 'portrait' && <Icons.User size={32} strokeWidth={1.5} />}
                      {cat.id === 'events' && <Icons.Calendar size={32} strokeWidth={1.5} />}
                      {cat.id === 'product' && <Icons.Package size={32} strokeWidth={1.5} />}
                      {cat.id === 'mobile' && <Icons.Smartphone size={32} strokeWidth={1.5} />}
                      {cat.id === 'photojournalism' && <Icons.Newspaper size={32} strokeWidth={1.5} />}
                      {cat.id === 'videography' && <Icons.Video size={32} strokeWidth={1.5} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{cat.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
