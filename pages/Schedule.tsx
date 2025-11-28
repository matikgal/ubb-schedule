import React, { useState, useEffect, useRef } from 'react';
import { ClassEvent } from '../types';
import { getDayName, getStartOfWeek, addDays, formatDateRange, isSameDay, getWeekIdForDate } from '../utils';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import ClassCard from '../components/ClassCard';
import Toast from '../components/Toast';
import OfflineBadge from '../components/OfflineBadge';
import { fetchScheduleForWeek } from '../services/scheduleService';
import { getSelectedGroup } from '../services/groupService';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const SchedulePage: React.FC = () => {
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const datePickerRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();
  
  // Load data for current week
  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      setError(null);
      setShowToast(false);
      
      try {
        const selectedGroup = getSelectedGroup();
        
        console.log('📅 Selected group from localStorage:', selectedGroup);
        
        if (!selectedGroup) {
          setError(ERROR_MESSAGES.NO_GROUP_SELECTED);
          setShowToast(true);
          setEvents([]);
          setIsLoading(false);
          return;
        }

        const groupId = selectedGroup.id;
        
        console.log('📅 Loading schedule for:', { groupId, currentWeekStart });
        
        // Nie przekazujemy weekId - fetchScheduleForWeek użyje pierwszego dostępnego tygodnia
        const scheduleData = await fetchScheduleForWeek(groupId);
        
        console.log('📅 Schedule data received:', scheduleData);
        
        setEvents(scheduleData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.FETCH_FAILED;
        console.error('❌ Error loading schedule:', err);
        setError(errorMessage);
        setShowToast(true);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [currentWeekStart]);

  // Set initial expanded state (expand "Today" if in current week)
  useEffect(() => {
    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today);
    
    // If the view is showing the current week
    if (isSameDay(currentWeekStart, startOfCurrentWeek)) {
        // 0 = Sunday, 1 = Monday... but our loop is 0-6 relative to Monday
        const todayDay = today.getDay(); // 0-6 (Sun-Sat)
        const dayIndex = todayDay === 0 ? 6 : todayDay - 1; // Convert to 0=Mon, 6=Sun
        setExpandedDayIndex(dayIndex);
    } else {
        setExpandedDayIndex(null); // Collapse all for other weeks
    }
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev: Date) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev: Date) => addDays(prev, 7));
  };

  const toggleDay = (index: number) => {
    if (expandedDayIndex === index) {
        setExpandedDayIndex(null);
    } else {
        setExpandedDayIndex(index);
    }
  };
  
  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
        const selected = new Date(e.target.value);
        const startOfWeek = getStartOfWeek(selected);
        setCurrentWeekStart(startOfWeek);
    }
  };

  const openDatePicker = () => {
    if (datePickerRef.current) {
        if ('showPicker' in HTMLInputElement.prototype) {
             try {
                datePickerRef.current.showPicker();
             } catch (e) {
                datePickerRef.current.click();
             }
        } else {
            datePickerRef.current.click();
        }
    }
  };

  const weekEnd = addDays(currentWeekStart, 6);
  const todayDate = new Date();

  return (
    <div className="space-y-6 animate-fade-in pt-6">
      {/* Offline Badge */}
      <OfflineBadge isVisible={!isOnline} />

      <div className="flex items-end justify-between mb-2">
         <div>
            <h1 className="text-3xl font-display font-bold text-main leading-tight">Kalendarz</h1>
            <p className="text-muted text-sm">Przegląd tygodniowy</p>
         </div>
         <div className="relative">
             <button 
                onClick={openDatePicker}
                className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-border text-muted hover:text-primary transition-colors hover:bg-hover active:scale-95"
             >
                <Calendar size={18} />
             </button>
             {/* Hidden Date Input */}
             <input 
                ref={datePickerRef}
                type="date"
                onChange={handleDateSelect}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
             />
         </div>
      </div>

      {/* Week Navigator */}
      <div className={`flex items-center justify-between bg-surface rounded-xl p-2 border border-border mb-6 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
         <button 
            onClick={handlePrevWeek} 
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center hover:bg-hover rounded-lg text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <ChevronLeft size={20} />
         </button>
         
         <div className="text-center relative">
            <div className="text-xs font-bold text-muted uppercase tracking-wide mb-0.5">Tydzień</div>
            <div className="text-main font-display font-bold text-sm">
                {formatDateRange(currentWeekStart, weekEnd)}
            </div>
            {isLoading && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-primary rounded-full animate-pulse" />
            )}
         </div>

         <button 
            onClick={handleNextWeek} 
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center hover:bg-hover rounded-lg text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <ChevronRight size={20} />
         </button>
      </div>

      {/* Loading State - Skeleton Screens */}
      {isLoading && (
        <div className="space-y-3 animate-fade-in">
          {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
            // Show expanded skeleton for "today" (index 2 for Wednesday as example)
            const isExpandedSkeleton = dayOffset === 2;
            
            return (
              <div 
                key={dayOffset} 
                className={`rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-300`}
                style={{ animationDelay: `${dayOffset * 50}ms` }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Day Badge Skeleton */}
                    <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                    
                    {/* Day Info Skeleton */}
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer rounded w-24" />
                      <div className="h-3 skeleton-shimmer rounded w-16" />
                    </div>
                    
                    {/* Chevron Skeleton */}
                    <div className="w-5 h-5 rounded skeleton-shimmer" />
                  </div>
                </div>
                
                {/* Expanded Content Skeleton */}
                {isExpandedSkeleton && (
                  <div className="px-4 pb-4 space-y-3 animate-slide-down">
                    <div className="h-[1px] w-full bg-border mb-4"></div>
                    {[1, 2, 3].map((classIdx) => (
                      <div key={classIdx} className="p-4 rounded-xl bg-hover/50 space-y-3">
                        {/* Time skeleton */}
                        <div className="h-3 skeleton-shimmer rounded w-20" />
                        {/* Subject skeleton */}
                        <div className="h-5 skeleton-shimmer rounded w-3/4" />
                        {/* Details skeleton */}
                        <div className="flex gap-2">
                          <div className="h-3 skeleton-shimmer rounded w-16" />
                          <div className="h-3 skeleton-shimmer rounded w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notification */}
      {showToast && error && !isLoading && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
          <Toast 
            message={error} 
            type="error" 
            onClose={() => setShowToast(false)}
            duration={5000}
          />
        </div>
      )}

      {/* Days List (Accordion) */}
      {!isLoading && !error && (
        <div className="space-y-3 animate-fade-in">
         {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
             const currentDate = addDays(currentWeekStart, dayOffset);
             // Convert loop index (0=Mon) to API format (1=Mon... 7=Sun)
             const apiDayOfWeek = dayOffset + 1; 
             
             const dayEvents = events
                .filter(e => e.dayOfWeek === apiDayOfWeek)
                .sort((a,b) => a.startTime.localeCompare(b.startTime));
             
             const isExpanded = expandedDayIndex === dayOffset;
             const isToday = isSameDay(currentDate, todayDate);
             const hasClasses = dayEvents.length > 0;

             return (
                 <div key={dayOffset} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-surface border-border' : 'bg-transparent border-transparent'}`}>
                     
                     {/* Accordion Header */}
                     <button 
                        onClick={() => toggleDay(dayOffset)}
                        className={`w-full flex items-center justify-between p-4 transition-colors ${!isExpanded && 'hover:bg-hover rounded-2xl'}`}
                     >
                        <div className="flex items-center gap-4">
                            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl border ${isToday ? 'bg-primary text-black border-primary' : 'bg-surface border-border text-muted'}`}>
                                <span className="text-[10px] font-bold uppercase leading-none">{getDayName(apiDayOfWeek === 7 ? 0 : apiDayOfWeek).substring(0, 3)}</span>
                                <span className="text-sm font-bold leading-none mt-0.5">{currentDate.getDate()}</span>
                            </div>
                            <div className="text-left">
                                <div className={`font-bold text-sm ${isToday ? 'text-primary' : 'text-main'}`}>
                                    {getDayName(apiDayOfWeek === 7 ? 0 : apiDayOfWeek)}
                                </div>
                                <div className="text-xs text-muted font-medium">
                                    {hasClasses ? `${dayEvents.length} zajęć` : 'Wolne'}
                                </div>
                            </div>
                        </div>

                        {isExpanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                     </button>

                     {/* Accordion Content */}
                     {isExpanded && (
                         <div className="px-4 pb-4 animate-slide-down">
                            <div className="h-[1px] w-full bg-border mb-4 mx-2"></div>
                             {hasClasses ? (
                                 <div className="space-y-0">
                                     {dayEvents.map((evt, idx) => (
                                         <ClassCard 
                                            key={evt.id} 
                                            event={evt} 
                                            isLast={idx === dayEvents.length - 1}
                                         />
                                     ))}
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center justify-center py-8 text-muted opacity-60 animate-fade-in">
                                     <Clock size={24} className="mb-2" />
                                     <p className="text-xs font-medium">Brak zaplanowanych zajęć</p>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             );
         })}
        </div>
      )}
      
      {/* Bottom Spacer for Nav */}
      <div className="h-12"></div>
    </div>
  );
};

export default SchedulePage;