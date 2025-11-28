import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { UNIVERSITY_STRUCTURE } from '../services/mockData';

interface SelectionPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const SelectionPill: React.FC<SelectionPillProps> = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
      active 
        ? 'bg-primary text-black border-primary' 
        : 'bg-surface border-border text-muted hover:bg-hover'
    }`}
  >
    {label}
  </button>
);

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  const faculty = UNIVERSITY_STRUCTURE.find(f => f.name === selectedFaculty);
  const fields = faculty ? faculty.fields : [];
  const field = fields.find(f => f.name === selectedField);
  const semesters = field ? field.semesters : [];
  const semester = semesters.find(s => s.number.toString() === selectedSemester);
  const groups = semester ? semester.groups : [];

  const handleSave = () => {
    if (!selectedGroup) return;
    const dataToSave = {
      faculty: selectedFaculty,
      field: selectedField,
      semester: selectedSemester,
      group: selectedGroup
    };
    localStorage.setItem('selectedGroup', JSON.stringify(dataToSave));
    navigate('/');
  };

  return (
    <div className="space-y-10 animate-fade-in pt-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-main mb-2">Znajdź plan</h1>
        <p className="text-muted text-sm">Wybierz swoją grupę zajęciową.</p>
      </div>

      {/* Minimal Search Input */}
      <div className="bg-surface rounded-xl flex items-center p-1 border border-border focus-within:border-primary/50 transition-colors">
            <div className="p-3 text-muted">
                <SearchIcon size={20} />
            </div>
            <input 
                type="text" 
                placeholder="Szukaj sali lub wykładowcy..." 
                className="w-full p-2 outline-none text-main bg-transparent placeholder:text-muted text-sm"
            />
      </div>

      {/* Filter Flow */}
      <div className="space-y-8">
          
          <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Wydział</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {UNIVERSITY_STRUCTURE.map(f => (
                      <SelectionPill 
                          key={f.name} 
                          label={f.name.split(' ')[1] || f.name} 
                          active={selectedFaculty === f.name} 
                          onClick={() => {
                              setSelectedFaculty(f.name);
                              setSelectedField('');
                              setSelectedSemester('');
                              setSelectedGroup('');
                          }} 
                      />
                  ))}
              </div>
          </div>

          {selectedFaculty && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Kierunek</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {fields.map(f => (
                        <SelectionPill 
                            key={f.name} 
                            label={f.name} 
                            active={selectedField === f.name} 
                            onClick={() => {
                                setSelectedField(f.name);
                                setSelectedSemester('');
                                setSelectedGroup('');
                            }} 
                        />
                    ))}
                </div>
             </div>
          )}

          {selectedField && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Semestr</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {semesters.map(s => (
                        <SelectionPill 
                            key={s.number} 
                            label={`Semestr ${s.number}`} 
                            active={selectedSemester === s.number.toString()} 
                            onClick={() => {
                                setSelectedSemester(s.number.toString());
                                setSelectedGroup('');
                            }} 
                        />
                    ))}
                </div>
             </div>
          )}

           {selectedSemester && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Grupa</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {groups.map(g => (
                        <SelectionPill 
                            key={g} 
                            label={`Grupa ${g}`} 
                            active={selectedGroup === g} 
                            onClick={() => setSelectedGroup(g)} 
                        />
                    ))}
                </div>
             </div>
          )}
      </div>

      {/* Save Button */}
      {selectedGroup && (
          <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center animate-bounce-in z-30">
              <button 
                onClick={handleSave}
                className="flex items-center gap-3 bg-primary text-black px-8 py-3.5 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform"
              >
                 Zapisz wybór <ArrowRight size={18} />
              </button>
          </div>
      )}
    </div>
  );
};

export default SearchPage;