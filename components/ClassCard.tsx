import React from 'react';
import { ClassEvent } from '../types';
import { MapPin, User } from 'lucide-react';

interface ClassCardProps {
  event: ClassEvent;
  isActive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const ClassCard: React.FC<ClassCardProps> = ({ event, isActive, isLast }) => {
  
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

                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5 text-xs text-muted">
                        <MapPin size={14} className="opacity-70" />
                        {event.room}
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-muted">
                        <User size={14} className="opacity-70" />
                        <span>{event.teacher}</span>
                     </div>
                </div>
             </div>
        </div>
    </div>
  );
};

export default ClassCard;