import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages } from '../hooks/useMessages';
import { usePhotographers } from '../hooks/usePhotographers';
import { AperturePulseLoader } from '../components/SkeletonLoader';
import apiClient from '../lib/api-client';

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
  onViewProfile?: (photographerId: string) => void;
  onBookSession?: (photographerId: string) => void;
}

const ChatDetail: React.FC<ChatDetailProps> = ({ 
  conversationId, 
  chatPartner, 
  onBack, 
  onViewProfile,
  onBookSession 
}) => {
  const { conversations, messages: liveMessages, isLoading, sendMessage } = useMessages(conversationId);
  const { getPhotographerById } = usePhotographers();

  const conversation = conversations.find(c => 
    c.id === conversationId || 
    c.participantId === conversationId || 
    c.photographerId === conversationId
  );
  
  const [partner, setPartner] = useState<ChatPartnerInfo | null>(() => {
    if (chatPartner) return chatPartner;
    if (conversation) {
      return {
        id: conversation.participantId || conversation.photographerId,
        name: conversation.participantName || conversation.photographerName,
        avatar: conversation.participantImage || conversation.photographerAvatar || null,
        isOnline: conversation.online === true
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
        id: conversation.participantId || conversation.photographerId,
        name: conversation.participantName || conversation.photographerName,
        avatar: conversation.participantImage || conversation.photographerAvatar || null,
        isOnline: conversation.online === true
      });
      return;
    }
    getPhotographerById(conversationId).then(p => {
      if (p) {
        setPartner({
          id: p.id,
          name: p.name,
          avatar: p.imageUrl || p.avatar || null,
          isOnline: false
        });
      }
    });
  }, [chatPartner, conversation, conversationId, getPhotographerById]);

  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Menu Sub-modals & States
  const [activeMenuAction, setActiveMenuAction] = useState<'review' | 'contracts' | 'terminate' | null>(null);
  const [selectedContractTab, setSelectedContractTab] = useState<'service' | 'ip'>('service');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [downloadingContract, setDownloadingContract] = useState<string | null>(null);
  const [contractDownloaded, setContractDownloaded] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    if (!customText) setInputText('');
    const targetId = partner?.id || conversation?.participantId || conversation?.photographerId || conversationId;
    await sendMessage(conversationId, targetId, textToSend);
  };

  const isCompletedBooking = conversation?.bookingDetails?.status?.toLowerCase() === 'completed';

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompletedBooking) {
      setReviewError("Reviews can only be recorded for sessions marked as completed by the studio.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      const targetRevieweeId = partner?.id || conversation?.participantId || conversation?.photographerId || conversationId;
      await apiClient.post('/reviews', {
        bookingId: conversation?.id || conversationId,
        revieweeId: targetRevieweeId,
        rating: reviewRating,
        comment: reviewComment || 'Exceptional photographic artistry and professional session delivery.'
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setActiveMenuAction(null);
        setReviewComment('');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit review:', err.message);
      setReviewError(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadContract = (type: string) => {
    setDownloadingContract(type);
    
    const clientName = 'Private Client';
    const photographerName = displayName || 'Studio Master';
    const isService = type === 'service';
    const title = isService ? 'ARTISAN PHOTOGRAPHY SERVICE MANDATE' : 'INTELLECTUAL PROPERTY & MODEL RELEASE AGREEMENT';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const reference = `CF-MDT-${Math.floor(100000 + Math.random() * 900000)}`;

    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${reference}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111827; line-height: 1.6; max-width: 800px; margin: 0 auto; background: #fff; }
    .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
    .ref { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
    h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .parties { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: 700; font-size: 13px; text-transform: uppercase; margin-bottom: 6px; color: #111; }
    .section-body { font-size: 12px; color: #374151; }
    .signatures { margin-top: 40px; border-top: 1px dashed #d1d5db; padding-top: 24px; display: flex; justify-content: space-between; gap: 20px; }
    .sig-box { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; font-size: 12px; }
    .stamp { display: inline-block; padding: 4px 8px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 4px; font-weight: 700; font-size: 10px; margin-top: 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">CLICKFLICKS ARTISAN PLATFORM</div>
      <div class="ref">Republic of Ghana • Escrow-Secured Agreement</div>
    </div>
    <div style="text-align: right;">
      <div class="ref">Mandate Ref: <strong>${reference}</strong></div>
      <div class="ref">Issued: ${dateStr}</div>
    </div>
  </div>

  <h1>${title}</h1>
  <p style="font-size: 12px; color: #6b7280; margin-bottom: 24px;">Governed under the Laws of the Republic of Ghana and ClickFlicks Visual Art Standards.</p>

  <div class="parties">
    <div><strong>Commissioned Master:</strong> ${photographerName}</div>
    <div style="margin-top: 6px;"><strong>Commissioning Client:</strong> ${clientName}</div>
    <div style="margin-top: 6px;"><strong>Status:</strong> Digital Counter-Party Signature Verified</div>
  </div>

  ${isService ? `
  <div class="section">
    <div class="section-title">1. Scope of Photographic Services & Call Time</div>
    <div class="section-body">The Master agrees to arrive on location at the scheduled call time equipped with professional cameras, lenses, and lighting equipment to capture photographic assets per the confirmed session brief.</div>
  </div>
  <div class="section">
    <div class="section-title">2. Asset Delivery Timeline</div>
    <div class="section-body">Retouched high-fidelity digital master files shall be delivered to the Client Digital Vault within fourteen (14) business days post-shoot date.</div>
  </div>
  <div class="section">
    <div class="section-title">3. Escrow Settlement</div>
    <div class="section-body">Platform remittances are escrow-secured. Deposit authorizations are released upon verified session commencement, and completion balances are settled upon digital deliverable release.</div>
  </div>
  ` : `
  <div class="section">
    <div class="section-title">1. Copyright Retention</div>
    <div class="section-body">The Master retains statutory moral and intellectual copyright in all original raw and edited imagery created during the session under the Copyright Act, 2005 (Act 690) of Ghana.</div>
  </div>
  <div class="section">
    <div class="section-title">2. Client Usage License</div>
    <div class="section-body">Client is granted an irrevocable, perpetual, non-exclusive worldwide license for personal display, social media broadcasting, and promotional printing.</div>
  </div>
  <div class="section">
    <div class="section-title">3. Model Likeness Consent</div>
    <div class="section-body">Client authorizes the Master to showcase selected deliverable portfolio assets exclusively for artistic awards and curated exhibition showcases.</div>
  </div>
  `}

  <div class="signatures">
    <div class="sig-box">
      <div style="font-weight: bold; margin-bottom: 4px;">Photographer Digital Seal</div>
      <div style="font-size: 11px; color: #4b5563;">Digitally Authorized by ${photographerName}</div>
      <div class="stamp">VERIFIED MANDATE</div>
    </div>
    <div class="sig-box">
      <div style="font-weight: bold; margin-bottom: 4px;">Client Digital Signature</div>
      <div style="font-size: 11px; color: #4b5563;">Digitally Confirmed by ${clientName}</div>
      <div class="stamp">SIGNED VIA CLICKFLICKS</div>
    </div>
  </div>
</body>
</html>`;

    setTimeout(() => {
      try {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reference}_${type.toUpperCase()}_MANDATE.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error('Download error:', err);
      }
      setDownloadingContract(null);
      setContractDownloaded(true);
      setTimeout(() => setContractDownloaded(false), 2500);
    }, 1200);
  };

  const handleTerminate = () => {
    setIsTerminating(true);
    handleSend("⚠️ Communication session concluded by client.");
    setTimeout(() => {
      setIsTerminating(false);
      setActiveMenuAction(null);
      onBack();
    }, 1200);
  };

  const shareLocation = () => {
    handleSend("📍 Shared Location: Accra Central, Ghana");
    setShowAttachments(false);
  };

  const shareMedia = () => {
    handleSend("🖼️ Shared Reference Moodboard Image");
    setShowAttachments(false);
  };

  const shareDocument = () => {
    handleSend("📄 Shared Session Brief Document (.pdf)");
    setShowAttachments(false);
  };

  const handleBookClick = () => {
    const targetPhotographerId = partner?.id || conversation?.participantId || conversation?.photographerId || conversationId;
    if (onBookSession) {
      onBookSession(targetPhotographerId);
    } else if (onViewProfile) {
      onViewProfile(targetPhotographerId);
    }
  };

  const displayName = partner?.name || conversation?.participantName || 'Sarah Smith';
  const displayAvatar = partner?.avatar || conversation?.participantImage || conversation?.photographerAvatar || null;
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PH';

  const isOnline = partner?.isOnline === true || conversation?.online === true;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 absolute inset-0 overflow-hidden">
      {/* Sticky Header */}
      <header className="pt-12 pb-5 px-6 bg-white/90 backdrop-blur-2xl border-b border-gray-100 flex items-center space-x-3 sm:space-x-4 shadow-sm z-50 shrink-0">
        <button 
          onClick={onBack} 
          className="p-2.5 -ml-2 text-gray-900 bg-gray-50 rounded-2xl active:scale-90 transition-transform shadow-sm shrink-0"
        >
          <Icons.ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="relative shrink-0">
          {displayAvatar ? (
            <img 
              src={displayAvatar} 
              alt="" 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" 
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-brand-light flex items-center justify-center font-serif font-black text-sm border-2 border-white shadow-sm">
              {initials}
            </div>
          )}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${isOnline ? 'bg-emerald-500 ring-2 ring-white' : 'bg-gray-300 ring-2 ring-white'} rounded-full`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif font-black text-gray-900 italic text-xl leading-tight tracking-tight truncate">
            {displayName}
          </h2>
          <div className="flex items-center space-x-2 mt-0.5">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50' : 'border border-gray-400 bg-transparent'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                {isOnline ? 'Active Now' : 'Offline'}
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-[9px] font-black text-brand-DEFAULT uppercase tracking-[0.15em]">Master Artist</span>
          </div>
        </div>

        {/* Book Studio Button */}
        <button
          onClick={handleBookClick}
          className="px-3 py-2 bg-gray-900 text-white font-bold text-[11px] rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 shrink-0 hover:bg-black transition-all"
        >
          <Icons.Calendar size={13} />
          <span>Book</span>
        </button>

        <button 
          onClick={() => setShowMenu(true)} 
          className="p-2.5 text-gray-400 bg-gray-50 rounded-2xl hover:text-gray-900 transition-colors shrink-0"
        >
          <Icons.Menu size={18} />
        </button>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-8 pb-28 space-y-6 no-scrollbar">
        {isLoading && liveMessages.length === 0 ? (
          <div className="py-20">
            <AperturePulseLoader label="Opening encrypted studio channel..." />
          </div>
        ) : liveMessages.length > 0 ? (
          liveMessages.map((msg, idx) => {
            const isSender = msg.isSender === true || msg.role === 'user' || msg.sender === 'user';
            const timeLabel = msg.time || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now');

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] p-4 sm:p-5 rounded-[26px] text-sm font-medium leading-relaxed shadow-md ${
                    isSender
                      ? 'bg-gray-900 text-gray-100 rounded-br-none shadow-black/10'
                      : 'bg-white text-gray-900 border border-gray-200/90 rounded-bl-none shadow-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div className={`flex items-center mt-2.5 space-x-1.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] font-black uppercase tracking-wider text-gray-400">
                      {timeLabel}
                    </span>
                    {isSender && (
                      <Icons.Check size={11} className="text-brand-DEFAULT" strokeWidth={3} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
              <Icons.Sparkles size={24} className="text-brand-DEFAULT" />
            </div>
            <p className="text-gray-900 font-bold text-xs uppercase tracking-widest mb-1">Direct Channel</p>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider">Start your session conversation with {displayName}</p>
          </div>
        )}
        <div ref={scrollRef} className="h-2" />
      </div>

      {/* Input Console */}
      <div className="p-3 sm:p-4 bg-white/95 backdrop-blur-3xl border-t border-gray-100 flex items-center space-x-2 z-50 shrink-0">
        <div className="relative">
          <button 
            onClick={() => setShowAttachments(!showAttachments)}
            className="w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-900 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-all active:scale-95"
          >
            <Icons.Plus size={18} strokeWidth={2.5} />
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
            className="w-full bg-gray-50 border border-gray-200 py-3.5 pl-4 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-gray-900 font-medium text-xs transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="absolute right-1.5 top-1.5 w-9 h-9 bg-gray-900 text-white rounded-xl disabled:opacity-30 disabled:grayscale transition-all active:scale-90 flex items-center justify-center shadow-md"
          >
            <Icons.Send size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Options Menu Drawer */}
      <AnimatePresence>
        {showMenu && (
          <div className="fixed inset-0 z-[120] flex justify-end">
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
              className="relative w-[280px] h-full bg-white shadow-2xl p-8 z-10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-serif font-black italic text-gray-900">Options</h3>
                  <button onClick={() => setShowMenu(false)} className="p-2 text-gray-400 hover:text-gray-900"><Icons.X size={22} /></button>
                </div>
                <div className="space-y-6">
                  <MenuOption 
                    icon={Icons.Calendar} 
                    label="Book Studio Session" 
                    onClick={() => {
                      setShowMenu(false);
                      handleBookClick();
                    }} 
                  />
                  <MenuOption 
                    icon={Icons.User} 
                    label="View Studio Profile" 
                    onClick={() => {
                      setShowMenu(false);
                      const targetPhotographerId = partner?.id || conversation?.participantId || conversation?.photographerId || conversationId;
                      if (onViewProfile) onViewProfile(targetPhotographerId);
                    }} 
                  />
                  <MenuOption 
                    icon={Icons.Star} 
                    label="Write Artistic Review" 
                    onClick={() => {
                      setShowMenu(false);
                      setReviewError(null);
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
                </div>
              </div>

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
              className="relative w-full max-w-[440px] max-h-[90vh] bg-white rounded-[40px] p-8 shadow-2xl overflow-y-auto no-scrollbar z-10"
            >
               {activeMenuAction === 'review' && (
                 <form onSubmit={handleReviewSubmit} className="space-y-6">
                    <h3 className="text-2xl font-serif font-black italic text-gray-900">Session Review</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Share your creative experience with {displayName}</p>
                    
                    {!isCompletedBooking && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-800 text-xs leading-relaxed">
                        <div className="font-bold flex items-center space-x-1.5 mb-1">
                          <Icons.AlertTriangle size={14} className="text-amber-600" />
                          <span>Session In Progress</span>
                        </div>
                        Artistic reviews are unlocked once your booked session has been completed and deliverables delivered by the studio.
                      </div>
                    )}

                    {reviewError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                        {reviewError}
                      </div>
                    )}

                    <div className="flex justify-center space-x-3 py-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 text-yellow-500 active:scale-125 transition-transform"
                        >
                          <Icons.Star size={30} className={star <= reviewRating ? "fill-current" : "text-gray-200"} />
                        </button>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Artistic Testimonial</label>
                      <textarea 
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="The artistic lighting, composition, and prompt delivery exceeded expectations..." 
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-medium h-32 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" 
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        type="button"
                        onClick={() => setActiveMenuAction(null)}
                        className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmittingReview || !isCompletedBooking}
                        className="flex-1 bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl active:scale-95 transition-all disabled:opacity-40"
                      >
                        {isSubmittingReview ? <Icons.Loader2 className="animate-spin" size={16} /> : reviewSubmitted ? <span>Review Recorded <Icons.Check size={16} className="inline ml-1"/></span> : 'Publish Review'}
                      </button>
                    </div>
                 </form>
               )}

               {activeMenuAction === 'contracts' && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-serif font-black italic text-gray-900">Session Contracts</h3>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">Legally Binding Mandates</p>
                      </div>
                      <div className="p-3 bg-brand-DEFAULT/10 rounded-2xl text-brand-DEFAULT">
                        <Icons.ShieldCheck size={24} />
                      </div>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                      <button 
                        onClick={() => setSelectedContractTab('service')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedContractTab === 'service' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      >
                        Service Mandate
                      </button>
                      <button 
                        onClick={() => setSelectedContractTab('ip')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedContractTab === 'ip' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      >
                        IP & License
                      </button>
                    </div>

                    <div className="h-64 overflow-y-auto no-scrollbar bg-gray-50 rounded-3xl p-5 text-xs text-gray-700 font-medium space-y-4 border border-gray-100">
                      {selectedContractTab === 'service' ? (
                        <>
                          <div className="border-b border-gray-200/80 pb-3">
                            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Standard Artisan Service Agreement (Ghana)</h4>
                            <p className="text-[10px] text-gray-500">Executed between Client and Commissioned Visual Master</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">1. SCOPE OF SERVICES & CALL TIME</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">The Master agrees to arrive on location at the scheduled call time equipped with professional cameras, lenses, and lighting equipment to capture photographic assets per the session brief.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">2. ASSET DELIVERY TIMELINE</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">Retouched high-fidelity digital master files shall be delivered to the Client Vault within fourteen (14) business days post-shoot date.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">3. FINANCIAL REMITTANCE</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">Platform commissions are escrow-secured. Deposit authorizations are released upon verified session commencement, and completion balances are settled upon digital delivery.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">4. WEATHER & RESCHEDULING</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">Outdoor sessions impacted by inclement weather may be rescheduled within 30 days without cancellation penalty upon mutual consent.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="border-b border-gray-200/80 pb-3">
                            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Intellectual Property & Model Release Addendum</h4>
                            <p className="text-[10px] text-gray-500">Governed under the Copyright Act, 2005 (Act 690) of the Republic of Ghana</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">1. COPYRIGHT RETENTION</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">The Master retains statutory moral and intellectual copyright in all original raw and edited imagery created during the session.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">2. CLIENT USAGE LICENSE</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">Client is granted an irrevocable, perpetual, non-exclusive worldwide license for personal display, social media broadcasting, and personal promotional publication.</p>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 mb-1 text-[11px]">3. MODEL LIKENESS CONSENT</p>
                            <p className="text-[11px] leading-relaxed text-gray-600">Client authorizes the Master to showcase selected masterpiece deliverables exclusively for portfolio exhibitions and artistic awards.</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => handleDownloadContract(selectedContractTab)}
                        disabled={downloadingContract !== null}
                        className="w-full p-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-xl active:scale-95 transition-all"
                      >
                        {downloadingContract ? (
                          <>
                            <Icons.Loader2 size={16} className="animate-spin" />
                            <span>Generating Mandate Document...</span>
                          </>
                        ) : contractDownloaded ? (
                          <>
                            <Icons.Check size={16} className="text-emerald-400" />
                            <span>Mandate Verified & Downloaded</span>
                          </>
                        ) : (
                          <>
                            <Icons.Package size={16} />
                            <span>Download Signed PDF Mandate</span>
                          </>
                        )}
                      </button>
                      <button onClick={() => setActiveMenuAction(null)} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Dismiss</button>
                    </div>
                 </div>
               )}

               {activeMenuAction === 'terminate' && (
                 <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                      <Icons.X size={32} className="text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-2">Conclude Studio Session?</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-relaxed px-4">
                        This will archive all communication and session logs with {displayName}.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setActiveMenuAction(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Cancel</button>
                      <button 
                        onClick={handleTerminate}
                        className="flex-1 bg-red-500 text-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 flex items-center justify-center"
                      >
                        {isTerminating ? <Icons.Loader2 className="animate-spin" size={16} /> : 'Conclude'}
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
