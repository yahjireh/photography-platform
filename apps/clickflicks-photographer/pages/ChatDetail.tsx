import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { useMessages } from '../hooks/useMessages';

export interface ChatPartnerInfo {
  id: string;
  name: string;
  avatar?: string | null;
  isOnline?: boolean;
}

interface ChatDetailProps {
  conversationId: string;
  chatPartner?: ChatPartnerInfo | null;
  onBack: () => void;
}

const ChatDetail: React.FC<ChatDetailProps> = ({ conversationId, chatPartner, onBack }) => {
  const { conversations, messages: liveMessages, sendMessage } = useMessages(conversationId);
  const conversation = conversations.find(c => 
    c.id === conversationId || 
    c.photographerId === conversationId
  );
  
  const [partner, setPartner] = useState<ChatPartnerInfo | null>(() => {
    if (chatPartner) return chatPartner;
    if (conversation) {
      return {
        id: conversation.photographerId,
        name: conversation.photographerName,
        avatar: conversation.photographerAvatar || null,
        isOnline: true
      };
    }
    return null;
  });

  useEffect(() => {
    if (chatPartner) {
      setPartner(chatPartner);
      return;
    }
    if (conversation) {
      setPartner({
        id: conversation.photographerId,
        name: conversation.photographerName,
        avatar: conversation.photographerAvatar || null,
        isOnline: true
      });
    }
  }, [chatPartner, conversation]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveMessages) {
      setMessages(liveMessages);
    }
  }, [liveMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;
    
    if (!customText) setInputText('');

    const targetId = partner?.id || conversation?.photographerId || conversationId;
    await sendMessage(
      conversationId, 
      targetId, 
      textToSend
    );
  };

  const sendInvoicePrompt = () => {
    handleSend("💼 Dispatched Session Invoice (Due via Platform Escrow)");
    setShowAttachments(false);
  };

  const sendContractPrompt = () => {
    handleSend("📄 Dispatched Standard Ghana Artisan Photography Service Mandate & IP Licensing Agreement");
    setShowAttachments(false);
  };

  const sendLocationPrompt = () => {
    handleSend("📍 Studio Location: Labone Creative Quarter, Accra, Ghana");
    setShowAttachments(false);
  };

  const partnerName = partner?.name || conversation?.photographerName || 'Client Inquiry';
  const partnerAvatar = partner?.avatar || conversation?.photographerAvatar;
  const partnerInitials = partnerName
    ? partnerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CL';

  return (
    <div className="flex flex-col h-full bg-gray-50/50 absolute inset-0 overflow-hidden">
      {/* Cinematic Header */}
      <header className="pt-12 pb-5 px-6 bg-white/90 backdrop-blur-2xl border-b border-gray-100 flex items-center space-x-4 shadow-sm z-50">
        <button 
          onClick={onBack} 
          className="p-2.5 -ml-2 text-gray-900 bg-gray-50 rounded-2xl active:scale-90 transition-transform shadow-sm"
        >
          <Icons.ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="relative">
            {partnerAvatar ? (
              <img 
                src={partnerAvatar} 
                alt="" 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" 
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-700">
                {partnerInitials}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif font-black text-gray-900 italic text-xl leading-tight tracking-tight">
            {partnerName}
          </h2>
          <span className="text-[9px] font-black text-brand-DEFAULT uppercase tracking-[0.2em]">Active Client Session</span>
        </div>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-6 no-scrollbar">
        {messages.map((msg, idx) => {
          const isSender = msg.sender === 'photographer' || (msg as any).isSender;

          return (
            <motion.div 
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[78%] rounded-3xl p-4 shadow-sm ${
                  isSender 
                    ? 'bg-gray-900 text-gray-100 rounded-tr-sm' 
                    : 'bg-white text-gray-900 border border-gray-100/80 rounded-tl-sm'
                }`}
              >
                {msg.type === 'image' && msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="" className="rounded-2xl mb-2 w-full object-cover max-h-48" />
                )}
                <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className={`text-[8px] font-bold ${isSender ? 'text-gray-400' : 'text-gray-400'}`}>
                    {msg.time}
                  </span>
                  {isSender && (
                    <Icons.Check size={10} className={msg.status === 'read' ? 'text-brand-DEFAULT' : 'text-gray-400'} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Attachments Drawer */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-white border-t border-gray-100 flex justify-around shadow-lg z-40"
          >
            <button 
              onClick={sendInvoicePrompt}
              className="flex flex-col items-center space-y-1 text-gray-600 active:scale-95"
            >
              <div className="p-3 bg-brand-DEFAULT/10 text-brand-DEFAULT rounded-2xl">
                <Icons.CreditCard size={18} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Invoice</span>
            </button>
            <button 
              onClick={sendContractPrompt}
              className="flex flex-col items-center space-y-1 text-gray-600 active:scale-95"
            >
              <div className="p-3 bg-gray-100 text-gray-800 rounded-2xl">
                <Icons.FileCheck size={18} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Mandate</span>
            </button>
            <button 
              onClick={sendLocationPrompt}
              className="flex flex-col items-center space-y-1 text-gray-600 active:scale-95"
            >
              <div className="p-3 bg-gray-100 text-gray-800 rounded-2xl">
                <Icons.MapPin size={18} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">Studio PIN</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-gray-100 flex items-center space-x-2 z-50">
        <button 
          onClick={() => setShowAttachments(prev => !prev)}
          className={`p-3 rounded-2xl transition-colors ${showAttachments ? 'bg-brand-DEFAULT text-black' : 'bg-gray-100 text-gray-600'}`}
        >
          <Icons.Plus size={18} />
        </button>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Compose message or session brief response..."
          className="flex-1 bg-gray-50 border border-gray-100 py-3.5 px-4 rounded-2xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/20"
        />
        <button 
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-3.5 bg-gray-900 text-brand-light disabled:opacity-40 rounded-2xl active:scale-90 transition-transform shadow-md"
        >
          <Icons.Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
