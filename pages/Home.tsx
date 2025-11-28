import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getEventsForGroup, MOCK_SCHEDULE } from '../services/mockData';
import { ClassEvent } from '../types';
import { getCurrentTimeMinutes, getMinutesFromMidnight, getDayName, isSameDay } from '../utils';
import { MapPin, GraduationCap, ArrowRight, User, Plus, X, Calculator, Timer, Trash2, AlertCircle, Check, Archive, RotateCcw, CalendarRange, ExternalLink, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// --- Types ---
interface Deadline {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
}

interface ToastState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

interface ConfirmState {
    isOpen: boolean;
    itemId?: string;
    title: string;
    message: string;
}

const Home: React.FC = () => {
  // --- Existing State ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todaysEvents, setTodaysEvents] = useState<ClassEvent[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null); // Ref for date picker
  const [isDemo, setIsDemo] = useState(false);
  const [minutesNow, setMinutesNow] = useState(getCurrentTimeMinutes());

  // --- New Features State ---
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [archivedDeadlines, setArchivedDeadlines] = useState<Deadline[]>([]);
  
  // Modals & UI States
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({ isOpen: false, title: '', message: '' });

  // --- Load Initial Data ---
  useEffect(() => {
    // Load Group/Events based on SELECTED DATE
    const savedGroup = localStorage.getItem('selectedGroup');
    let eventsToProcess: ClassEvent[] = [];
    
    // Calculate API Day (1=Mon ... 7=Sun) based on selectedDate
    const dayIndex = selectedDate.getDay(); 
    const apiDay = dayIndex === 0 ? 7 : dayIndex;

    if (!savedGroup) {
        setIsDemo(true);
        // In demo mode, just show Monday if the day matches Monday, otherwise show nothing or mock data
        eventsToProcess = MOCK_SCHEDULE.filter(e => e.dayOfWeek === apiDay);
        // If empty in demo mode, maybe show Monday's data just so it's not empty for the user
        if (eventsToProcess.length === 0 && apiDay === 1) {
            eventsToProcess = MOCK_SCHEDULE.filter(e => e.dayOfWeek === 1);
        }
    } else {
        const parsedGroup = JSON.parse(savedGroup);
        const groupCode = parsedGroup.group || '5A'; 
        const allEvents = getEventsForGroup(groupCode);
        eventsToProcess = allEvents.filter(e => e.dayOfWeek === apiDay);
    }
    
    const sortedEvents = eventsToProcess.sort((a, b) => 
      getMinutesFromMidnight(a.startTime) - getMinutesFromMidnight(b.startTime)
    );
    setTodaysEvents(sortedEvents);

    // Reset progress if changing days
    if (!isSameDay(selectedDate, new Date())) {
        setProgress(0);
        setActiveIndex(0);
    }

    // Load Deadlines & Archive
    const savedDeadlines = JSON.parse(localStorage.getItem('user-deadlines') || '[]');
    const savedArchive = JSON.parse(localStorage.getItem('user-deadlines-archive') || '[]');
    
    // Check for expiration (Auto-Archive)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const active: Deadline[] = [];
    const expired: Deadline[] = [];

    savedDeadlines.forEach((d: Deadline) => {
        const dDate = new Date(d.date);
        dDate.setHours(0,0,0,0);
        // If date is before yesterday (allow "today" to stay visible)
        if (dDate.getTime() < today.getTime() - 86400000) {
            expired.push(d);
        } else {
            active.push(d);
        }
    });

    // Update states if anything expired
    if (expired.length > 0) {
        const newArchive = [...savedArchive, ...expired];
        setDeadlines(active);
        setArchivedDeadlines(newArchive);
        localStorage.setItem('user-deadlines', JSON.stringify(active));
        localStorage.setItem('user-deadlines-archive', JSON.stringify(newArchive));
    } else {
        setDeadlines(savedDeadlines);
        setArchivedDeadlines(savedArchive);
    }

  }, [isDemo, selectedDate]);


  // --- Timer & Progress Logic ---
  useEffect(() => {
    // Only run live timer if looking at TODAY
    const isToday = isSameDay(selectedDate, new Date());
    
    if (!isToday) {
        setMinutesNow(0); // Reset or stop updating
        return; 
    }

    // Immediate update on mount
    setMinutesNow(getCurrentTimeMinutes());

    const interval = setInterval(() => {
        const now = getCurrentTimeMinutes();
        setMinutesNow(now);

        let activeIdx = 0;
        let foundActive = false;

        todaysEvents.forEach((evt, idx) => {
            const start = getMinutesFromMidnight(evt.startTime);
            const end = getMinutesFromMidnight(evt.endTime);

            if (now >= start && now < end) {
                activeIdx = idx;
                foundActive = true;
                const totalDuration = end - start;
                const elapsed = now - start;
                setProgress((elapsed / totalDuration) * 100);
            } else if (now < start && !foundActive) {
                if (!foundActive) activeIdx = idx;
            }
        });

        if (now > getMinutesFromMidnight(todaysEvents[todaysEvents.length - 1]?.endTime || '00:00') && todaysEvents.length > 0) {
            activeIdx = todaysEvents.length - 1;
            setProgress(100);
        }
        
        if (activeIdx !== activeIndex) {
            setActiveIndex(activeIdx);
        }

    }, 1000 * 30);

    return () => clearInterval(interval);
  }, [todaysEvents, activeIndex, selectedDate]);


  useEffect(() => {
    if (carouselRef.current && todaysEvents.length > 0) {
        // Only scroll to active if it's today, otherwise scroll to start
        const isToday = isSameDay(selectedDate, new Date());
        const targetIndex = isToday ? activeIndex : 0;

        const scrollContainer = carouselRef.current;
        const activeElement = scrollContainer.children[targetIndex] as HTMLElement;
        if (activeElement) {
             setTimeout(() => {
                 activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
             }, 500);
        }
    }
  }, [activeIndex, todaysEvents.length, selectedDate]);


  // --- Handlers ---
  
  const handleDayChange = (offset: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + offset);
      setSelectedDate(newDate);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
        setSelectedDate(new Date(e.target.value));
    }
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
        if ('showPicker' in HTMLInputElement.prototype) {
            try {
                dateInputRef.current.showPicker();
            } catch (error) {
                dateInputRef.current.click();
            }
        } else {
            dateInputRef.current.click();
        }
    }
  };

  const getDayTitle = () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      if (isSameDay(selectedDate, today)) return 'Dziś';
      if (isSameDay(selectedDate, tomorrow)) return 'Jutro';
      
      const dayIndex = selectedDate.getDay();
      const apiDay = dayIndex === 0 ? 7 : dayIndex;
      return getDayName(apiDay);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  };

  const handleAddDeadline = () => {
      if (!newDeadlineTitle || !newDeadlineDate) {
          showToast("Uzupełnij nazwę i datę", "error");
          return;
      }
      
      const newDeadline: Deadline = {
          id: Date.now().toString(),
          title: newDeadlineTitle,
          date: newDeadlineDate
      };
      
      const updated = [...deadlines, newDeadline].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setDeadlines(updated);
      localStorage.setItem('user-deadlines', JSON.stringify(updated));
      
      setNewDeadlineTitle('');
      setNewDeadlineDate('');
      setIsDeadlineModalOpen(false);
      showToast("Dodano deadline");
  };

  const initiateDeleteDeadline = (id: string) => {
      setConfirmDialog({
          isOpen: true,
          itemId: id,
          title: "Archiwizuj",
          message: "Czy przenieść ten termin do archiwum?"
      });
  };

  const confirmDelete = () => {
      if (!confirmDialog.itemId) return;
      
      const itemToArchive = deadlines.find(d => d.id === confirmDialog.itemId);
      if (itemToArchive) {
          const updatedDeadlines = deadlines.filter(d => d.id !== confirmDialog.itemId);
          const updatedArchive = [...archivedDeadlines, itemToArchive];
          
          setDeadlines(updatedDeadlines);
          setArchivedDeadlines(updatedArchive);
          
          localStorage.setItem('user-deadlines', JSON.stringify(updatedDeadlines));
          localStorage.setItem('user-deadlines-archive', JSON.stringify(updatedArchive));
          showToast("Przeniesiono do archiwum");
      }
      
      setConfirmDialog({ isOpen: false, title: '', message: '' });
  };

  const deleteFromArchive = (id: string) => {
      const updated = archivedDeadlines.filter(d => d.id !== id);
      setArchivedDeadlines(updated);
      localStorage.setItem('user-deadlines-archive', JSON.stringify(updated));
  };

  const restoreFromArchive = (id: string) => {
      const item = archivedDeadlines.find(d => d.id === id);
      if (item) {
          const updatedArchive = archivedDeadlines.filter(d => d.id !== id);
          const updatedDeadlines = [...deadlines, item].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          setArchivedDeadlines(updatedArchive);
          setDeadlines(updatedDeadlines);
          
          localStorage.setItem('user-deadlines', JSON.stringify(updatedDeadlines));
          localStorage.setItem('user-deadlines-archive', JSON.stringify(updatedArchive));
          showToast("Przywrócono deadline");
      }
  };

  const getDeadlineColor = (dateStr: string) => {
      const diffTime = new Date(dateStr).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays < 0) return 'bg-slate-500/10 text-muted border-slate-500/20'; // Past
      if (diffDays <= 3) return 'bg-red-500/10 text-red-500 border-red-500/20'; // Critical
      if (diffDays <= 7) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'; // Warning
      return 'bg-green-500/10 text-green-500 border-green-500/20'; // Safe
  };

  const getDaysLeft = (dateStr: string) => {
    const diffTime = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Po terminie';
    if (diffDays === 0) return 'Dziś';
    if (diffDays === 1) return 'Jutro';
    return `${diffDays} dni`;
  };

  const isTodayView = isSameDay(selectedDate, new Date());
  
  // Format selected date for input value (YYYY-MM-DD)
  const dateInputValue = selectedDate.toISOString().split('T')[0];

  return (
    <div className="space-y-10 animate-fade-in relative">
      
      {/* --- Header & Date Navigation --- */}
      <div className="flex justify-between items-end px-1">
          <div>
            <h2 className="text-3xl font-display font-bold text-primary tracking-tight">
                {getDayTitle()}
            </h2>
            <span className="text-xs font-medium text-muted block mt-0.5">
                {selectedDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
            </span>
          </div>
          
          {/* Day Navigator */}
          <div className="glass rounded-full flex items-center p-1 border border-border/50 relative">
             <button 
                onClick={() => handleDayChange(-1)} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hover text-muted transition-colors active:scale-95"
             >
                 <ChevronLeft size={18} />
             </button>
             
             {/* Hidden Date Input */}
             <input 
                ref={dateInputRef}
                type="date"
                value={dateInputValue}
                onChange={handleDateSelect}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-0"
             />

             <button 
                onClick={openDatePicker}
                className="px-3 py-1.5 flex items-center gap-1.5 hover:bg-hover rounded-lg transition-colors group relative z-10"
             >
                 <Calendar size={14} className={`group-hover:text-primary transition-colors ${isTodayView ? 'text-primary' : 'text-muted'}`} />
                 <span className={`text-xs font-bold ${isTodayView ? 'text-main' : 'text-muted'}`}>
                    {isTodayView ? 'Dziś' : selectedDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                 </span>
             </button>
             
             <button 
                onClick={() => handleDayChange(1)} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hover text-muted transition-colors active:scale-95"
             >
                 <ChevronRight size={18} />
             </button>
          </div>
      </div>

      {/* --- Carousel --- */}
      <section>
        {todaysEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-3xl mx-1 bg-surface/30">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                     <Calendar size={24} className="text-muted opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-main">Brak zajęć</h3>
                <p className="text-sm text-muted mt-1 max-w-[200px]">
                    W tym dniu nie masz zaplanowanych żadnych zajęć na uczelni.
                </p>
                {!isTodayView && (
                    <button 
                        onClick={() => setSelectedDate(new Date())}
                        className="mt-6 text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
                    >
                        Wróć do dzisiaj
                    </button>
                )}
            </div>
        ) : (
            <div 
                ref={carouselRef}
                className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-8 -mx-5 px-[12.5vw] no-scrollbar items-center"
            >
                {todaysEvents.map((evt, idx) => {
                    // Logic: If looking at today, calculate active. If looking at another day, show all as standard.
                    const isActive = isTodayView && idx === activeIndex;
                    const isPast = isTodayView && idx < activeIndex;
                    const endTimeMins = getMinutesFromMidnight(evt.endTime);
                    const minutesLeft = endTimeMins - minutesNow;
                    
                    return (
                        <div key={evt.id} className="snap-center shrink-0 w-[75vw] max-w-[320px] transition-all duration-500">
                            <div className={`relative h-full transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-85 scale-95'}`}>
                                <div className={`bg-surface rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between min-h-[200px] relative overflow-hidden ${isActive ? 'border-transparent shadow-xl' : 'border-transparent bg-surface/50'}`}>
                                {isActive && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>}
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            {isTodayView && (
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${isActive ? 'bg-primary text-black' : 'bg-slate-500/10 text-muted'}`}>
                                                    {isActive ? 'Teraz' : isPast ? 'Koniec' : 'Wkrótce'}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold border border-border px-2 py-1 rounded-md uppercase tracking-wide ${isActive ? 'text-main bg-background/50' : 'text-muted'}`}>
                                            {evt.type}
                                        </span>
                                    </div>
                                    <h3 className={`text-xl font-display font-bold leading-snug mb-3 line-clamp-2 ${isActive ? 'text-primary' : 'text-main'}`}>
                                        {evt.subject}
                                    </h3>
                                    <div className="flex flex-col gap-2 text-sm text-muted">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="opacity-70" />
                                            <span>{evt.room}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="opacity-70" />
                                            <span className="truncate opacity-80">{evt.teacher}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 mt-6">
                                    {/* Updated Start/End time display with countdown for active class */}
                                    <div className="flex justify-between text-xs font-medium text-muted items-center">
                                        <span>{evt.startTime}</span>
                                        
                                        {isActive && minutesLeft > 0 && (
                                            <span className="text-primary font-bold animate-pulse text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
                                                {minutesLeft} min do końca
                                            </span>
                                        )}
                                        
                                        <span>{evt.endTime}</span>
                                    </div>
                                    
                                    {/* Progress Bar only on Today */}
                                    <div className="h-1 w-full bg-slate-500/10 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ease-linear ${isActive ? 'bg-primary' : 'bg-transparent'}`} 
                                            style={{ width: isTodayView ? (isActive ? `${progress}%` : isPast ? '100%' : '0%') : '0%' }}
                                        ></div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </section>

      {/* --- Deadlines Section --- */}
      <section className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-display font-bold text-main">Deadline'y</h3>
            <button 
                onClick={() => setIsArchiveOpen(true)}
                className="flex items-center gap-2 text-[10px] font-bold text-muted bg-surface px-3 py-1.5 rounded-full border border-border hover:bg-hover transition-colors"
            >
                <Archive size={12} />
                <span>ARCHIWUM</span>
            </button>
         </div>

         <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
            {deadlines.map((dl) => {
                const colorClass = getDeadlineColor(dl.date);
                return (
                    <div key={dl.id} className={`shrink-0 w-32 aspect-square rounded-2xl p-3 flex flex-col justify-between border ${colorClass} relative group transition-transform active:scale-95`}>
                         <div className="flex justify-between items-start">
                             <span className="text-[10px] font-bold uppercase opacity-70">
                                 {new Date(dl.date).toLocaleDateString('pl-PL', {day: 'numeric', month: 'short'})}
                             </span>
                         </div>
                         <div>
                             <h4 className="font-bold text-sm leading-tight line-clamp-2 mb-1">
                                 {dl.title}
                             </h4>
                             <p className="text-[10px] font-medium opacity-80">
                                 {getDaysLeft(dl.date)}
                             </p>
                         </div>
                         
                         {/* Bigger Delete Button */}
                         <button 
                             onClick={(e) => { e.stopPropagation(); initiateDeleteDeadline(dl.id); }}
                             className="absolute bottom-2 right-2 p-2 text-current opacity-70 hover:opacity-100 hover:scale-110 transition-all rounded-full hover:bg-background/10"
                         >
                             <Trash2 size={16} />
                         </button>
                    </div>
                )
            })}

            {/* BIG ADD BUTTON */}
            <button 
                onClick={() => setIsDeadlineModalOpen(true)}
                className="shrink-0 w-32 aspect-square rounded-2xl bg-surface border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-all group"
            >
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:scale-110 transition-all">
                    <Plus size={20} />
                </div>
                <span className="text-xs font-bold">Dodaj</span>
            </button>
         </div>
      </section>

      {/* --- Shortcuts --- */}
      <section className="space-y-6">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-display font-bold text-main">Na skróty</h3>
            <div className="w-8 h-1 bg-primary/20 rounded-full"></div>
         </div>
         <div className="grid grid-cols-2 gap-3">
             <Link to="/calculator" className="bg-surface p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-hover transition-all group">
                 <Calculator size={24} className="text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
                 <h4 className="text-main font-bold text-sm">Średnia</h4>
                 <p className="text-[11px] text-muted mt-1">Kalkulator ocen</p>
             </Link>
             
             {/* Academic Calendar - PDF Link */}
             <a 
                href="https://studia.ubb.edu.pl/informacje-dla-studenta/harmonogram-studiow-2025-2026" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-surface p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-hover transition-all"
            >
                 <CalendarRange size={24} className="text-blue-400 mb-3" />
                 <h4 className="text-main font-bold text-sm">Harmonogram</h4>
                 <p className="text-[11px] text-muted mt-1">Kalendarz (PDF)</p>
             </a>

             <a href="https://ubb.edu.pl/" target="_blank" rel="noopener noreferrer" className="bg-surface p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-hover transition-all col-span-2 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <GraduationCap size={24} className="text-muted-green" />
                     <div>
                        <h4 className="text-main font-bold text-sm">Strona UBB</h4>
                        <p className="text-[11px] text-muted mt-0.5">ubb.edu.pl</p>
                     </div>
                 </div>
                 <ArrowRight size={16} className="text-muted" />
             </a>
         </div>
         
         {/* Map Preview with Click-To-Open (Solves Mobile Issues) */}
         <div className="bg-surface rounded-2xl overflow-hidden border border-border relative group">
             <div className="p-4 border-b border-border flex justify-between items-center bg-surface z-10 relative">
                 <span className="text-xs font-bold uppercase tracking-wide text-muted">Kampus</span>
             </div>
             
             {/* The Map Visual */}
             {/* Oversized container to ensure no gaps, with overlay INSIDE relative to it */}
             <div className="w-full h-[300px] relative bg-surface overflow-hidden group-hover:grayscale-0 transition-all duration-500 grayscale-[0.2]">
                
                {/* Interactive Map Overlay Button - MOVED INSIDE to avoid gaps */}
                <a 
                    href="https://www.google.com/maps/d/u/0/viewer?mid=1lKPgQeR_rcpO3_0hG_UXL5nJ6WrmVqI&ehbc=2E312F&z=17" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors cursor-pointer"
                >
                    <div className="bg-surface/90 backdrop-blur-md px-4 py-2.5 rounded-full flex items-center gap-2 border border-border shadow-xl transform transition-transform group-hover:scale-105">
                        <ExternalLink size={16} className="text-primary" />
                        <span className="text-xs font-bold text-main">Otwórz mapę</span>
                    </div>
                </a>

                {/* Iframe */}
                <iframe 
                    src="https://www.google.com/maps/d/u/0/embed?mid=1lKPgQeR_rcpO3_0hG_UXL5nJ6WrmVqI&ehbc=2E312F&z=17" 
                    style={{ 
                        border: 0, 
                        position: 'absolute',
                        top: '-65px', 
                        left: '0',
                        width: '100%',
                        height: 'calc(100% + 250px)' // Heavily oversized height to push google controls out of view
                    }} 
                    allowFullScreen={false} 
                    loading="lazy"
                    title="Mapa Kampusu"
                    className="opacity-90 relative z-0"
                ></iframe>
             </div>
         </div>
      </section>

      {/* --- MODALS --- */}

      {/* Add Deadline Modal */}
      {isDeadlineModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-surface border border-border rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-display font-bold text-lg text-main">Dodaj termin</h3>
                      <button onClick={() => setIsDeadlineModalOpen(false)}><X size={20} className="text-muted" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-muted uppercase ml-1">Nazwa</label>
                          <input 
                            type="text" 
                            className="w-full bg-background border border-border rounded-xl p-3 text-main outline-none focus:border-primary mt-1" 
                            placeholder="np. Kolokwium Analiza"
                            value={newDeadlineTitle}
                            onChange={(e) => setNewDeadlineTitle(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-muted uppercase ml-1">Data</label>
                          <input 
                            type="date" 
                            className="w-full bg-background border border-border rounded-xl p-3 text-main outline-none focus:border-primary mt-1" 
                            value={newDeadlineDate}
                            onChange={(e) => setNewDeadlineDate(e.target.value)}
                          />
                      </div>
                      <button 
                        onClick={handleAddDeadline}
                        className="w-full bg-primary text-black font-bold py-3 rounded-xl mt-2 hover:opacity-90 transition-opacity"
                      >
                          Dodaj
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Archive Modal */}
      {isArchiveOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <Archive size={20} className="text-primary" />
                        <h3 className="font-display font-bold text-lg text-main">Archiwum</h3>
                      </div>
                      <button onClick={() => setIsArchiveOpen(false)}><X size={20} className="text-muted" /></button>
                  </div>
                  
                  <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                      {archivedDeadlines.length === 0 ? (
                          <div className="text-center py-10 text-muted opacity-60 text-sm">
                              Puste archiwum
                          </div>
                      ) : (
                          archivedDeadlines.map(item => (
                              <div key={item.id} className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
                                  <div>
                                      <h4 className="text-sm font-bold text-main line-clamp-1 opacity-70">{item.title}</h4>
                                      <p className="text-[10px] text-muted">{item.date}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => restoreFromArchive(item.id)} className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20">
                                          <RotateCcw size={14} />
                                      </button>
                                      <button onClick={() => deleteFromArchive(item.id)} className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20">
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-slide-up">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-main">{confirmDialog.title}</h3>
                        <p className="text-sm text-muted mt-1">{confirmDialog.message}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        <button 
                            onClick={() => setConfirmDialog({isOpen: false, title: '', message: ''})}
                            className="py-2.5 rounded-xl border border-border text-main font-bold text-sm hover:bg-hover transition-colors"
                        >
                            Anuluj
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                        >
                            Archiwizuj
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] animate-fade-in-up w-auto whitespace-nowrap">
            <div className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-surface border-green-500/30 text-green-500' : 'bg-surface border-red-500/30 text-red-500'}`}>
                {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span className="text-sm font-bold">{toast.message}</span>
            </div>
        </div>
      )}

    </div>
  );
};

export default Home;