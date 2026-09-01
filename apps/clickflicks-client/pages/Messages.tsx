import React from 'react';
import { Icons } from '../components/ui/icons';
import { motion } from 'framer-motion';
import { useMessages } from '../hooks/useMessages';
import { ConversationSkeleton } from '../components/SkeletonLoader';

interface MessagesProps {
  onConversationClick: (id: string) => void;
}

const Messages: React.FC<MessagesProps> = ({ onConversationClick }) => {
  const { conversations, isLoading } = useMessages();

  return (
    <div className="pb-32 bg-white min-h-screen">
      <header className="pt-16 pb-8 px-6 bg-white border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-DEFAULT mb-2">Private Studio Channel</p>
          <h1 className="text-4xl font-serif font-black text-gray-900 tracking-tight italic leading-none">
            Conversations
          </h1>
        </motion.div>
      </header>

      {isLoading ? (
        <div className="divide-y divide-gray-50">
          <ConversationSkeleton />
          <ConversationSkeleton />
          <ConversationSkeleton />
        </div>
      ) : conversations && conversations.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {conversations.map((conv, idx) => {
            const avatarUrl = conv.participantImage || conv.photographerAvatar;
            const initials = conv.participantName
              ? conv.participantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'ST';

            return (
              <motion.div
                key={conv.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => conv.id && onConversationClick(conv.id)}
                className="flex items-center p-6 space-x-4 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={conv.participantName} 
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-brand-light flex items-center justify-center font-serif font-black text-lg border border-gray-100 shadow-sm">
                      {initials}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-brand-DEFAULT w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-[8px] font-black text-white">{conv.unreadCount}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-serif font-bold text-gray-900 text-lg truncate pr-2">{conv.participantName}</h3>
                    <span className="text-[9px] font-bold text-gray-400 uppercase shrink-0">{conv.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
                <Icons.ChevronRight size={16} className="text-gray-300 shrink-0" />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 px-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.MessageSquare size={32} className="text-gray-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-serif font-black text-gray-900 italic tracking-tight mb-2">No Active Conversations</h3>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-[260px] mx-auto">
            Book a session or message a photographer directly to start discussing your project.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
