import React, { useState, useRef } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
    id: string;
    title: string;
    client: string;
    time: string;
    duration: string;
    location: string;
    status: 'confirmed' | 'pending';
    type: 'shoot' | 'meeting' | 'personal';
}

const MOCK_EVENTS: Record<number, Event[]> = {
    14: [
        { id: 'e1', title: 'Pre-Wedding Shoot', client: 'Kofi & Ama', time: '09:00', duration: '4h', location: 'Aburi Gardens', status: 'confirmed', type: 'shoot' },
        { id: 'e2', title: 'Editorial Session', client: 'Vogue West Africa', time: '16:00', duration: '3h', location: 'Studio A', status: 'pending', type: 'shoot' }
    ],
    15: [
        { id: 'e3', title: 'Client Meeting', client: 'TechCorp', time: '10:00', duration: '1h', location: 'Zoom', status: 'confirmed', type: 'meeting' }
    ],
    16: [], // Empty for available slots demo
};

interface PhotographerScheduleProps {
  onOpenChat?: () => void;
}

const PhotographerSchedule: React.FC<PhotographerScheduleProps> = ({ onOpenChat }) => {
  const [selectedDate, setSelectedDate] = useState<number>(14);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Generate 2 weeks of dates
  const dates = Array.from({length: 14}, (_, i) => 12 + i);
  
  const currentEvents = MOCK_EVENTS[selectedDate] || [];

  const handleCalendarClick = () => {
    datePickerRef.current?.showPicker();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const day = new Date(e.target.value).getDate();
      setSelectedDate(day);
  };

  const handleContactClient = () => {
    if (onOpenChat) {
        onOpenChat();
        setViewEvent(null);
    }
  };

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen">
       <header className="pt-16 pb-6 px-6 bg-white border-b border-gray-100 sticky top-0 z-30">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-serif font-black text-gray-900 italic">Schedule</h1>
            <div className="relative">
                <button onClick={handleCalendarClick} className="p-2 bg-gray-50 rounded-xl text-gray-900 active:scale-90 transition-transform">
                    <Icons.Calendar size={20} />
                </button>
                <input 
                    ref={datePickerRef}
                    type="date" 
                    onChange={handleDateChange}
                    className="absolute inset-0 opacity-0 pointer-events-none" 
                />
            </div>
         </div>
         
         {/* Date Strip */}
         <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            {dates.map((date, idx) => {
                const isSelected = date === selectedDate;
                const days = ['S','M','T','W','T','F','S'];
                const dayLabel = days[(idx + 2) % 7]; // Offset for demo visual matching
                return (
                    <button 
                        key={idx}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center justify-center min-w-[54px] py-4 rounded-[20px] transition-all ${isSelected ? 'bg-gray-900 text-white shadow-xl scale-110' : 'bg-transparent text-gray-400 hover:bg-gray-100'}`}
                    >
                        <span className="text-[9px] font-bold uppercase tracking-widest mb-1">{dayLabel}</span>
                        <span className="text-xl font-serif font-black italic">{date}</span>
                    </button>
                )
            })}
         </div>
       </header>

       <div className="p-6 space-y-6">
         {/* Timeline */}
         <div className="relative border-l-2 border-gray-200 ml-3 pl-8 space-y-8 py-4 min-h-[50vh]">
            {/* Start Dot */}
            <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-gray-300"></div>
            
            {currentEvents.length > 0 ? (
                currentEvents.map((event, idx) => (
                    <div key={event.id} className="relative group">
                        <span className="absolute -left-[45px] text-xs font-bold text-gray-400">{event.time}</span>
                        <div className={`absolute -left-[37px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${event.status === 'confirmed' ? 'bg-brand-DEFAULT' : 'bg-accent-DEFAULT'}`}></div>
                        
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => setViewEvent(event)}
                            className={`p-5 rounded-3xl shadow-sm border cursor-pointer active:scale-95 transition-transform ${event.status === 'pending' ? 'bg-gray-900 text-white border-gray-800 shadow-xl' : 'bg-white border-gray-100'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${event.status === 'pending' ? 'text-gray-100' : 'text-gray-900'}`}>{event.title}</h3>
                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${event.status === 'pending' ? 'bg-white/20 text-white' : 'bg-brand-light/20 text-brand-dark'}`}>
                                    {event.status}
                                </span>
                            </div>
                            <p className={`text-xs mb-4 ${event.status === 'pending' ? 'text-gray-400' : 'text-gray-500'}`}>Client: {event.client}</p>
                            
                            {event.status === 'pending' ? (
                                <button onClick={(e) => { e.stopPropagation(); setViewEvent(event); }} className="w-full py-3 bg-white text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
                                    View Brief
                                </button>
                            ) : (
                                <div className="flex -space-x-2">
                                    <img src="https://picsum.photos/seed/u1/60/60" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                                    <img src="https://picsum.photos/seed/u2/60/60" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                                </div>
                            )}
                        </motion.div>
                    </div>
                ))
            ) : (
                <div className="py-12 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No bookings for this date</p>
                </div>
            )}

            {/* Always show at least one Available Slot for demo */}
            <div className="relative opacity-60">
                <span className="absolute -left-[45px] text-xs font-bold text-gray-400">13:00</span>
                <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white z-10"></div>
                <div 
                    onClick={() => setShowAddEvent(true)}
                    className="h-24 border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all"
                >
                    <div className="flex items-center space-x-2 text-gray-400">
                        <Icons.Plus size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Open Slot</span>
                    </div>
                </div>
            </div>
         </div>
       </div>

       {/* Floating Add Button */}
       <button 
        onClick={() => setShowAddEvent(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform border border-gray-800"
       >
            <Icons.Plus size={24} />
       </button>

       {/* View Brief / Event Details Modal */}
       <AnimatePresence>
            {viewEvent && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        onClick={() => setViewEvent(null)} 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                    />
                    <motion.div 
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
                        className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-serif font-black italic text-gray-900">{viewEvent.title}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{viewEvent.client}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-2xl"><Icons.Camera size={24} className="text-gray-900"/></div>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                                <Icons.Clock className="text-gray-400" size={20} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Time</p>
                                    <p className="font-bold text-gray-900">{viewEvent.time} ({viewEvent.duration})</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl">
                                <Icons.MapPin className="text-gray-400" size={20} />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Location</p>
                                    <p className="font-bold text-gray-900">{viewEvent.location}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button onClick={() => setViewEvent(null)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Close</button>
                            <button onClick={handleContactClient} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                Contact Client
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
       </AnimatePresence>

       {/* Add Event Modal */}
       <AnimatePresence>
            {showAddEvent && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        onClick={() => setShowAddEvent(false)} 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                    />
                    <motion.div 
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
                        className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl"
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                        <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">Block Time</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Title</label>
                                <input type="text" placeholder="Personal Appointment" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-brand-DEFAULT/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Start</label>
                                    <input type="time" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">End</label>
                                    <input type="time" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-bold text-gray-900 outline-none" />
                                </div>
                            </div>
                            <button onClick={() => setShowAddEvent(false)} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs mt-4">
                                Save Block
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
       </AnimatePresence>
    </div>
  );
};

export default PhotographerSchedule;