import React, { useState, useMemo } from 'react';
import { Icons } from '../components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotographerBookings } from '../hooks/usePhotographerBookings';

const PhotographerSchedule: React.FC = () => {
  const { bookings } = usePhotographerBookings();
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventClient, setNewEventClient] = useState('');
  const [customEvents, setCustomEvents] = useState<any[]>([]);

  // Dynamically compute the current 7-day strip
  const calendarDays = useMemo(() => {
    const today = new Date();
    const daysArr = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const dayName = dayNames[d.getDay()];

      // Check if bookings exist for this date
      const hasEvents = bookings.some(b => {
        if (!b.date && !b.rawDate) return false;
        const s = String(b.status).toLowerCase();
        if (s === 'rejected' || s === 'cancelled') return false;
        try {
          const bDate = b.rawDate || new Date(b.date).toISOString().split('T')[0];
          return bDate === dateStr;
        } catch (_) {
          return false;
        }
      }) || customEvents.some(ce => ce.dateStr === dateStr);

      daysArr.push({
        offset: i,
        dateStr,
        dayNum,
        dayName,
        hasEvents,
        fullDate: d
      });
    }
    return daysArr;
  }, [bookings, customEvents]);

  const activeDay = calendarDays[selectedDayOffset] || calendarDays[0];

  // Match bookings for the selected day
  const dayBookings = bookings.filter(b => {
    if (!b.date && !b.rawDate) return false;
    const s = String(b.status).toLowerCase();
    if (s === 'rejected' || s === 'cancelled') return false;
    try {
      const bDate = b.rawDate || new Date(b.date).toISOString().split('T')[0];
      return bDate === activeDay.dateStr;
    } catch (_) {
      return false;
    }
  });

  const dayCustomEvents = customEvents.filter(ce => ce.dateStr === activeDay.dateStr);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventTime) return;
    const newEv = {
      id: `ce_${Date.now()}`,
      dateStr: activeDay.dateStr,
      title: newEventTitle,
      time: newEventTime,
      location: 'Studio Location',
      client: newEventClient || 'Internal Task',
      type: 'custom'
    };
    setCustomEvents(prev => [...prev, newEv]);
    setIsAddingEvent(false);
    setNewEventTitle('');
    setNewEventTime('');
    setNewEventClient('');
  };

  const totalDayTasks = dayBookings.length + dayCustomEvents.length;
  const currentMonthYear = activeDay.fullDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="pb-32 bg-gray-50/50 min-h-screen">
      <header className="pt-16 pb-8 px-6 bg-white border-b border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-DEFAULT mb-2">Master Timeline</p>
              <h1 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-none italic">
                {currentMonthYear}
              </h1>
            </motion.div>
            <button 
                onClick={() => setIsAddingEvent(true)}
                className="w-10 h-10 bg-gray-900 text-gray-200 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
                <Icons.Plus size={20} />
            </button>
        </div>

        {/* Calendar Strip */}
        <div className="flex space-x-3 overflow-x-auto no-scrollbar py-2">
            {calendarDays.map((d) => (
                <button
                    key={d.offset}
                    onClick={() => setSelectedDayOffset(d.offset)}
                    className={`flex flex-col items-center min-w-[54px] py-3.5 rounded-2xl border transition-all ${
                        selectedDayOffset === d.offset 
                        ? 'bg-gray-900 text-gray-200 border-gray-900 shadow-md' 
                        : 'bg-white text-gray-400 border-gray-100'
                    }`}
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1">{d.dayName}</span>
                    <span className="text-base font-black">{d.dayNum}</span>
                    {d.hasEvents && (
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-brand-DEFAULT" />
                    )}
                </button>
            ))}
        </div>
      </header>

      {/* Timeline Schedule */}
      <div className="p-6 space-y-4">
         <div className="flex justify-between items-center mb-2">
             <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Scheduled Sessions</span>
             <span className="text-[10px] font-bold text-brand-DEFAULT uppercase tracking-widest">{totalDayTasks} Engagements</span>
         </div>

         {totalDayTasks > 0 ? (
           <>
             {dayBookings.map(b => (
                 <div key={b.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-start space-x-4">
                     <div className="p-3 bg-gray-50 rounded-2xl text-gray-900 mt-1">
                         <Icons.Clock size={18} />
                     </div>
                     <div className="flex-1">
                         <div className="flex justify-between items-start">
                           <span className="text-[9px] font-black uppercase tracking-widest text-brand-DEFAULT">{b.time}</span>
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                             b.status === 'accepted' || b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                           }`}>
                             {b.status}
                           </span>
                         </div>
                         <h3 className="font-serif font-bold text-lg text-gray-900 mt-0.5">{b.service}</h3>
                         <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                             <span className="flex items-center"><Icons.User size={12} className="mr-1 text-gray-400" /> {b.clientName}</span>
                             <span className="flex items-center"><Icons.MapPin size={12} className="mr-1 text-gray-400" /> {b.location}</span>
                         </div>
                     </div>
                 </div>
             ))}

             {dayCustomEvents.map(event => (
                 <div key={event.id} className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-start space-x-4">
                     <div className="p-3 bg-gray-50 rounded-2xl text-gray-900 mt-1">
                         <Icons.Clock size={18} />
                     </div>
                     <div className="flex-1">
                         <span className="text-[9px] font-black uppercase tracking-widest text-brand-DEFAULT">{event.time}</span>
                         <h3 className="font-serif font-bold text-lg text-gray-900 mt-0.5">{event.title}</h3>
                         <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                             <span className="flex items-center"><Icons.User size={12} className="mr-1 text-gray-400" /> {event.client}</span>
                             <span className="flex items-center"><Icons.MapPin size={12} className="mr-1 text-gray-400" /> {event.location}</span>
                         </div>
                     </div>
                 </div>
             ))}
           </>
         ) : (
             <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
                 <Icons.Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">No Scheduled Engagements</p>
                 <p className="text-[10px] text-gray-400 mt-1">Select another day or tap + to schedule custom tasks</p>
             </div>
         )}
      </div>

      {/* Add Custom Event Modal */}
      <AnimatePresence>
        {isAddingEvent && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingEvent(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-[480px] bg-white rounded-t-[40px] p-8 pb-12 z-10 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h3 className="text-2xl font-serif font-black italic text-gray-900 mb-6">Schedule Session</h3>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Session / Task Title</label>
                  <input type="text" required value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="e.g. Pre-wedding Consultation" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Time Interval</label>
                  <input type="text" required value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} placeholder="e.g. 02:00 PM - 03:30 PM" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Client / Contact</label>
                  <input type="text" value={newEventClient} onChange={(e) => setNewEventClient(e.target.value)} placeholder="e.g. Ama Serwaa" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none" />
                </div>
                <button type="submit" className="w-full bg-gray-900 text-gray-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4">
                  Schedule Event
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotographerSchedule;
