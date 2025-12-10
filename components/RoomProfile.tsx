import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { fetchScheduleForWeek, getAvailableWeeks, getCurrentWeekId } from '../services/scheduleService';
import { ClassEvent } from '../types';
import ScheduleViewer from './ScheduleViewer';

interface RoomProfileProps {
  roomId: number;
  roomName: string;
  faculty: string;
  onBack: () => void;
}

const RoomProfile: React.FC<RoomProfileProps> = ({ roomId, roomName, faculty, onBack }) => {
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [currentWeek, setCurrentWeek] = useState<{ id: string; label: string; start: Date; end: Date } | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<Array<{ id: string; label: string; start: Date; end: Date }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available weeks and initial schedule
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const weeks = await getAvailableWeeks(roomId, false, true); 
        setAvailableWeeks(weeks);

        if (weeks.length > 0) {
          const currentWeekId = await getCurrentWeekId(roomId, false, true);
          const initialWeek = weeks.find(w => w.id === currentWeekId) || weeks[0];
          setCurrentWeek(initialWeek);
          
          const schedule = await fetchScheduleForWeek(roomId, initialWeek.id, false, false, true); 
          setEvents(schedule);
        }
      } catch (err) {
        console.error('Failed to load room data:', err);
        setError('Nie udało się pobrać planu sali.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [roomId]);

  // Load schedule when week changes
  const loadSchedule = async (weekId: string) => {
    setIsLoading(true);
    try {
      const schedule = await fetchScheduleForWeek(roomId, weekId, false, false, true); // isRoom=true
      setEvents(schedule);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError('Nie udało się pobrać planu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevWeek = () => {
    if (!currentWeek || availableWeeks.length === 0) return;
    const currentIndex = availableWeeks.findIndex(w => w.id === currentWeek.id);
    if (currentIndex > 0) {
      const prevWeek = availableWeeks[currentIndex - 1];
      setCurrentWeek(prevWeek);
      loadSchedule(prevWeek.id);
    }
  };

  const handleNextWeek = () => {
    if (!currentWeek || availableWeeks.length === 0) return;
    const currentIndex = availableWeeks.findIndex(w => w.id === currentWeek.id);
    if (currentIndex < availableWeeks.length - 1) {
      const nextWeek = availableWeeks[currentIndex + 1];
      setCurrentWeek(nextWeek);
      loadSchedule(nextWeek.id);
    }
  };

  const handleDateSelect = useCallback((date: Date) => {
    // Find the week that contains this date
    const targetWeek = availableWeeks.find(w => 
      date >= w.start && date <= w.end
    );

    if (targetWeek && targetWeek.id !== currentWeek?.id) {
      setCurrentWeek(targetWeek);
      loadSchedule(targetWeek.id);
    }
  }, [availableWeeks, currentWeek]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-muted hover:text-primary hover:bg-hover transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-main leading-tight">{roomName}</h1>
          {faculty && faculty !== 'Unknown' && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <MapPin size={16} />
              <span>{faculty}</span>
            </div>
          )}
        </div>
      </div>

      <ScheduleViewer
        events={events}
        currentWeek={currentWeek}
        availableWeeks={availableWeeks}
        isLoading={isLoading}
        error={error}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onDateSelect={handleDateSelect}
        header={
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 bg-primary rounded-full"></div>
                <h2 className="text-lg font-bold text-main">Plan zajęć</h2>
            </div>
        }
      />
    </div>
  );
};

export default RoomProfile;
