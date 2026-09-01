import React, { useState, useRef, useEffect } from 'react';
import { MOCK_CONVERSATIONS, MOCK_CHAT_HISTORY } from '../constants';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';

interface ChatDetailProps {
  conversationId: string;
  onBack: () => void;
  onViewProfile?: (photographerId: string) => void;
}

const ChatDetail: React.FC<ChatDetailProps> = ({ conversationId, onBack, onViewProfile }) => {
  const conversation = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
  
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_HISTORY[conversationId] || []);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  
  // Menu Sub-modals & States
  const [activeMenuAction, setActiveMenuAction] = useState<'review' | 'contracts' | 'terminate' | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [downloadingContract, setDownloadingContract] = useState<string | null>(null);
  const [isTerminating, setIsTerminating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
    if (!customText) setInputText('');
  };

  const handleReviewSubmit = () => {
    setIsSubmittingReview(true);
    setTimeout(() => {
      setIsSubmittingReview(false);
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setActiveMenuAction(null);
      }, 1500);
    }, 1500);
  };

  const handleDownloadContract = (id: string) => {
    setDownloadingContract(id);
    setTimeout(() => {
      setDownloadingContract(null);
      // Logic to actually trigger download would go here
    }, 2000);
  };

  const handleTerminate = () => {
    setIsTerminating(true);
    setTimeout(() => {
      setIsTerminating(false);
      setActiveMenuAction(null);
      onBack(); // Navigate back after termination
    }, 2000);
  };

  const shareLocation = () => {
    handleSend("📍 Shared Location: Studio B, Accra Central");
    setShowAttachments(false);
  };

  const shareMedia = () => {
    handleSend("🖼️ Shared Reference Image");
    setShowAttachments(false);
  };

  const shareDocument = () => {
    handleSend("📄 Shared Brief Document (.pdf)");
    setShowAttachments(false);
  };

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 absolute inset-0 overflow-hidden">
      {/* Cinematic Sticky Header */}
      <header className="pt-12 pb-5 px-6 bg-white/90 backdrop-blur-2xl border-b border-gray-100 flex items-center space-x-4 shadow-sm z-50">
        <button 
          onClick={onBack} 
          className="p-2.5 -ml-2 text-gray-900 bg-gray-50 rounded-2xl active:scale-90 transition-transform shadow-sm"
        >
          <Icons.ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="relative">
            <img 
              src={conversation.participantImage} 
              alt="" 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-light border-2 border-white rounded-full" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif font-black text-gray-900 italic text-xl leading-tight tracking-tight">
            {conversation.participantName}
          </h2>
          <div className="flex items-center space-x-1">
             <span className="text-[9px] font-black text-brand-DEFAULT uppercase tracking-[0.2em]">Master Artist</span>
          </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-3 text-gray-400 bg-gray-50 rounded-2xl hover:text-gray-900 transition-colors">
          <Icons.Menu size={18} />
        </button>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-32 space-y-6 no-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx < messages.length - 2 ? 0 : 0.1, duration: 0.4 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-5 rounded-[28px] shadow-lg shadow-black/5 text-sm font-medium leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gray-900 text-gray-100 rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.text}
              <div className={`flex items-center mt-3 space-x-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                <span className={`text-[8px] font-black uppercase tracking-widest text-gray-400`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'user' && <Icons.Check size={10} className="text-brand-light" strokeWidth={3} />}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={scrollRef} className="h-4" />
      </div>

      {/* Premium Input Console */}
      <div className="absolute bottom-0 w-full p-6 bg-white/95 backdrop-blur-3xl border-t border-gray-100 pb-10 z-[60]">
        <div className="relative flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={() => setShowAttachments(!showAttachments)}
              className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-900 hover:bg-gray-100 rounded-2xl border border-gray-100 transition-all active:scale-95"
            >
              <Icons.Smartphone size={20} strokeWidth={2} />
            </button>
            <AnimatePresence>
              {showAttachments && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-14 left-0 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60]"
                >
                  <AttachmentItem icon={Icons.MapPin} label="Location" onClick={shareLocation} />
                  <AttachmentItem icon={Icons.Camera} label="Media" onClick={shareMedia} />
                  <AttachmentItem icon={Icons.Package} label="Document" onClick={shareDocument} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Draft your session brief..."
              className="w-full bg-gray-50 border border-gray-200 py-5 pl-6 pr-14 rounded-[24px] focus:outline-none focus:ring-4 focus:ring-brand-DEFAULT/5 text-gray-900 font-bold text-xs uppercase tracking-wide transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="absolute right-2.5 top-2.5 w-10 h-10 bg-gray-900 text-gray-200 rounded-xl disabled:opacity-30 disabled:grayscale transition-all active:scale-90 flex items-center justify-center shadow-lg shadow-black/10"
            >
              <Icons.Send size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Menu Popup */}
      <AnimatePresence>
        {showMenu && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25 }}
              className="relative w-[280px] h-full bg-white shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-serif font-black italic text-gray-900">Options</h3>
                <button onClick={() => setShowMenu(false)} className="p-2 text-gray-400"><Icons.X size={24} /></button>
              </div>
              <div className="space-y-6">
                <MenuOption 
                  icon={Icons.User} 
                  label="View Studio Profile" 
                  onClick={() => {
                    setShowMenu(false);
                    if (onViewProfile) onViewProfile(conversation.participantId);
                  }} 
                />
                <MenuOption 
                  icon={Icons.Star} 
                  label="Write Artistic Review" 
                  onClick={() => {
                    setShowMenu(false);
                    setActiveMenuAction('review');
                  }} 
                />
                <MenuOption 
                  icon={Icons.ShieldCheck} 
                  label="Session Contracts" 
                  onClick={() => {
                    setShowMenu(false);
                    setActiveMenuAction('contracts');
                  }} 
                />
                <div className="pt-6 border-t border-gray-100">
                  <MenuOption 
                    icon={Icons.X} 
                    label="Terminate Chat" 
                    color="text-red-500" 
                    onClick={() => {
                      setShowMenu(false);
                      setActiveMenuAction('terminate');
                    }} 
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Modals */}
      <AnimatePresence>
        {activeMenuAction && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveMenuAction(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
            >
               {activeMenuAction === 'review' && (
                 <div className="space-y-6">
                    <h3 className="text-2xl font-serif font-black italic text-gray-900">Session Review</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Share your creative experience with {conversation.participantName}</p>
                    <div className="flex justify-center space-x-2 py-4">
                      {[1,2,3,4,5].map(s => <Icons.Star key={s} size={28} className="text-yellow-500 fill-current" />)}
                    </div>
                    <textarea 
                      placeholder="The mastery was exceptional..." 
                      className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-medium h-32 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10"
                    />
                    <button 
                      onClick={handleReviewSubmit}
                      disabled={isSubmittingReview}
                      className="w-full bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2"
                    >
                      {isSubmittingReview ? <Icons.Loader2 className="animate-spin" size={16} /> : reviewSubmitted ? <span>Review Posted <Icons.Check size={16} className="inline ml-1"/></span> : 'Publish Review'}
                    </button>
                 </div>
               )}

               {activeMenuAction === 'contracts' && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-serif font-black italic text-gray-900">Asset Mandate</h3>
                      <Icons.ShieldCheck size={28} className="text-brand-DEFAULT" />
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleDownloadContract('service')}
                        className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between active:bg-gray-100 transition-colors"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Standard Service Agreement</span>
                        {downloadingContract === 'service' ? <Icons.Loader2 size={16} className="animate-spin text-gray-400"/> : <Icons.ChevronRight size={16} className="text-gray-400" />}
                      </button>
                      <button 
                        onClick={() => handleDownloadContract('ip')}
                        className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between active:bg-gray-100 transition-colors"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Intellectual Property License</span>
                        {downloadingContract === 'ip' ? <Icons.Loader2 size={16} className="animate-spin text-gray-400"/> : <Icons.ChevronRight size={16} className="text-gray-400" />}
                      </button>
                    </div>
                    <button onClick={() => setActiveMenuAction(null)} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Dismiss</button>
                 </div>
               )}

               {activeMenuAction === 'terminate' && (
                 <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                      <Icons.X size={32} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Terminate Studio Session?</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed px-4">
                        This will archive all communication and media logs with {conversation.participantName}.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setActiveMenuAction(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Cancel</button>
                      <button 
                        onClick={handleTerminate}
                        className="flex-1 bg-red-500 text-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 flex items-center justify-center"
                      >
                        {isTerminating ? <Icons.Loader2 className="animate-spin" size={16} /> : 'End Session'}
                      </button>
                    </div>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AttachmentItem: React.FC<{ icon: any, label: string, onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
    <Icon size={18} className="text-gray-900" />
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{label}</span>
  </button>
);

const MenuOption: React.FC<{ icon: any, label: string, color?: string, onClick?: () => void }> = ({ icon: Icon, label, color = "text-gray-900", onClick }) => (
  <button onClick={onClick} className="w-full flex items-center space-x-4 py-2 group">
    <Icon size={20} className={color} />
    <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{label}</span>
  </button>
);

export default ChatDetail;