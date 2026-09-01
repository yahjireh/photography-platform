import React from 'react';
import { MOCK_CONVERSATIONS } from '../constants';
import { Icons } from '../components/ui/icons';
import { motion } from 'framer-motion';

interface MessagesProps {
  onConversationClick: (id: string) => void;
}

const Messages: React.FC<MessagesProps> = ({ onConversationClick }) => {
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

      <div className="divide-y divide-gray-50">
        {MOCK_CONVERSATIONS.map((conv, idx) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onConversationClick(conv.id)}
            className="flex items-center p-6 space-x-4 active:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="relative">
              <img 
                src={conv.participantImage} 
                alt={conv.participantName} 
                className="w-14 h-14 rounded-2xl object-cover"
              />
              {conv.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-brand-DEFAULT w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-[8px] font-black text-white">{conv.unreadCount}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-serif font-bold text-gray-900 text-lg">{conv.participantName}</h3>
                <span className="text-[9px] font-bold text-gray-400 uppercase">{conv.timestamp}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{conv.lastMessage}</p>
            </div>
            <Icons.ChevronRight size={16} className="text-gray-300" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Messages;