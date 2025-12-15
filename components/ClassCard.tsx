import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClassEvent } from '../types';
import { MapPin, User, Users, StickyNote } from 'lucide-react';
import NotesModal from './NotesModal';

interface ClassCardProps {
  event: ClassEvent;
  isActive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  allowNotes?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({ event, isActive, isLast, allowNotes = true }) => {
  const navigate = useNavigate();
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');

  const handleNotesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSubject(event.subject);
    setIsNotesOpen(true);
  };

  // Swiss Style Pastel Palette
  const getColors = (type: string) => {
    switch (type) {
      case 'WYK': return { border: 'border-muted-blue/30', text: 'text-muted-blue', bg: 'bg-muted-blue/5' };
      case 'CW': return { border: 'border-muted-green/30', text: 'text-muted-green', bg: 'bg-muted-green/5' };
      case 'LAB': return { border: 'border-muted-purple/30', text: 'text-muted-purple', bg: 'bg-muted-purple/5' };
      default: return { border: 'border-slate-500/20', text: 'text-muted', bg: 'bg-slate-500/5' };
    }
  };

  const theme = getColors(event.type);

  const handleRoomClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.roomId) {
      navigate('/search', { state: { roomId: event.roomId } });
    }
  };

  const handleTeacherClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.teacherId) {
      navigate('/search', { state: { teacherId: event.teacherId } });
    }
  };

  const handleGroupClick = (groupName: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/search', { state: { groupName } });
  };

  return (
    <div className="flex gap-4 relative group">
      {/* Timeline Line */}
      <div className="flex flex-col items-center pt-2">
        <div className={`w-2.5 h-2.5 rounded-full border-2 z-10 transition-colors ${isActive ? 'bg-primary border-primary' : 'bg-surface border-slate-500/50'}`}></div>
        {!isLast && <div className="w-[1px] flex-1 bg-slate-500/20 my-1"></div>}
      </div>

      <div className={`flex-1 mb-6 transition-all duration-300`}>
        <div className={`rounded-xl p-5 border transition-all duration-300 ${isActive ? 'bg-surface border-primary/20 shadow-lg' : 'bg-transparent border-transparent hover:bg-hover'}`}>

          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-muted">
              {event.startTime} - {event.endTime}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${theme.bg} ${theme.text} ${theme.border}`}>
              {event.type}
            </span>
          </div>

          <h3 className={`text-lg font-display font-bold leading-tight mb-3 ${isActive ? 'text-primary' : 'text-main'}`}>
            {event.subject}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Room */}
            <button
              onClick={handleRoomClick}
              disabled={!event.roomId}
              className={`flex items-center gap-1.5 text-xs text-muted transition-colors ${event.roomId ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
            >
              <MapPin size={14} className="opacity-70" />
              {event.room}
            </button>

            {/* Teacher */}
            {event.teacher && (
              <button
                onClick={handleTeacherClick}
                disabled={!event.teacherId}
                className={`flex items-center gap-1.5 text-xs text-muted transition-colors ${event.teacherId ? 'hover:text-primary cursor-pointer' : 'cursor-default'}`}
              >
                <User size={14} className="opacity-70" />
                <span>{event.teacher}</span>
              </button>
            )}

            {/* Groups */}
            {event.groups && event.groups.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Users size={14} className="opacity-70" />
                <div className="flex flex-wrap gap-1">
                  {event.groups.map((group, idx) => (
                    <button
                      key={idx}
                      onClick={handleGroupClick(group)}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      {group}{idx < event.groups.length - 1 ? ',' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {allowNotes ? (
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
              <button
                onClick={handleNotesClick}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-primary transition-colors py-1 px-2 hover:bg-hover rounded-lg"
              >
                <StickyNote size={14} />
                Notatki
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        subjectName={currentSubject}
      />
    </div>
  );
};

export default ClassCard;