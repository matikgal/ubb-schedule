import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import Toast from '../components/Toast';
import OfflineBadge from '../components/OfflineBadge';
import { fetchFaculties, fetchMajorsForFaculty, fetchGroupsForMajor, saveSelectedGroup } from '../services/groupService';
import { GroupInfo } from '../types';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

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
  const isOnline = useOnlineStatus();
  
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedStudyType, setSelectedStudyType] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
  
  const [faculties, setFaculties] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  
  const [loadingFaculties, setLoadingFaculties] = useState<boolean>(false);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  
  const [error, setError] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // Mapowanie wyświetlanych nazw na wartości w bazie
  const studyTypeMapping: Record<string, string> = {
    'Stacjonarne': 'S',
    'Zaoczne': 'NW'
  };
  
  const studyTypes = Object.keys(studyTypeMapping);
  
  // Semestry (1-7 dla studiów inżynierskich)
  const semesters = [1, 2, 3, 4, 5, 6, 7];

  // Pobierz wydziały przy montowaniu komponentu
  useEffect(() => {
    const loadFaculties = async () => {
      setLoadingFaculties(true);
      setError('');
      setShowToast(false);
      try {
        const data = await fetchFaculties();
        setFaculties(data);
      } catch (err) {
        setError(ERROR_MESSAGES.FACULTIES_LOAD_ERROR);
        setShowToast(true);
        console.error('Error loading faculties:', err);
      } finally {
        setLoadingFaculties(false);
      }
    };

    loadFaculties();
  }, []);

  // Pobierz kierunki gdy wybrano wydział
  useEffect(() => {
    if (!selectedFaculty) {
      setFields([]);
      return;
    }

    const loadFields = async () => {
      setLoadingFields(true);
      setError('');
      setShowToast(false);
      try {
        const data = await fetchMajorsForFaculty(selectedFaculty);
        setFields(data);
      } catch (err) {
        setError(ERROR_MESSAGES.MAJORS_LOAD_ERROR);
        setShowToast(true);
        console.error('Error loading fields:', err);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [selectedFaculty]);

  // Pobierz grupy gdy wybrano wydział, kierunek, tryb studiów i semestr
  useEffect(() => {
    if (!selectedFaculty || !selectedField || !selectedStudyType || !selectedSemester) {
      setGroups([]);
      return;
    }

    const loadGroups = async () => {
      setLoadingGroups(true);
      setError('');
      setShowToast(false);
      try {
        // Zmapuj wyświetlaną nazwę na wartość w bazie (S lub NW)
        const dbStudyType = studyTypeMapping[selectedStudyType];
        console.log('🔄 Mapping study type:', selectedStudyType, '→', dbStudyType);
        
        const data = await fetchGroupsForMajor(selectedFaculty, selectedField, dbStudyType, selectedSemester);
        setGroups(data);
      } catch (err) {
        setError(ERROR_MESSAGES.GROUPS_LOAD_ERROR);
        setShowToast(true);
        console.error('Error loading groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, [selectedFaculty, selectedField, selectedStudyType, selectedSemester]);

  const handleSave = () => {
    if (!selectedGroup) return;
    
    try {
      saveSelectedGroup(selectedGroup);
      navigate('/');
    } catch (err) {
      setError(ERROR_MESSAGES.GROUP_SAVE_ERROR);
      setShowToast(true);
      console.error('Error saving group:', err);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pt-6">
      {/* Offline Badge */}
      <OfflineBadge isVisible={!isOnline} />

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

      {/* Toast Notification */}
      {showToast && error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
          <Toast 
            message={error} 
            type="error" 
            onClose={() => setShowToast(false)}
            duration={5000}
          />
        </div>
      )}

      {/* Filter Flow */}
      <div className="space-y-8">
          
          <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Wydział</h3>
              {loadingFaculties ? (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      className="px-5 py-2.5 rounded-full border border-border h-9 w-32 skeleton-shimmer"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
                    {faculties.map(f => (
                        <SelectionPill 
                            key={f} 
                            label={f} 
                            active={selectedFaculty === f} 
                            onClick={() => {
                                setSelectedFaculty(f);
                                setSelectedField('');
                                setSelectedStudyType('');
                                setSelectedSemester(null);
                                setSelectedGroup(null);
                            }} 
                        />
                    ))}
                </div>
              )}
          </div>

          {selectedFaculty && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Kierunek</h3>
                {loadingFields ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className="px-5 py-2.5 rounded-full border border-border h-9 w-40 skeleton-shimmer"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
                      {fields.map(f => (
                          <SelectionPill 
                              key={f} 
                              label={f} 
                              active={selectedField === f} 
                              onClick={() => {
                                  setSelectedField(f);
                                  setSelectedStudyType('');
                                  setSelectedSemester(null);
                                  setSelectedGroup(null);
                              }} 
                          />
                      ))}
                  </div>
                )}
             </div>
          )}

          {selectedField && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Tryb studiów</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {studyTypes.map(type => (
                        <SelectionPill 
                            key={type} 
                            label={type} 
                            active={selectedStudyType === type} 
                            onClick={() => {
                                setSelectedStudyType(type);
                                setSelectedSemester(null);
                                setSelectedGroup(null);
                            }} 
                        />
                    ))}
                </div>
             </div>
          )}

          {selectedStudyType && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Semestr</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {semesters.map(sem => (
                        <SelectionPill 
                            key={sem} 
                            label={`${sem}`} 
                            active={selectedSemester === sem} 
                            onClick={() => {
                                setSelectedSemester(sem);
                                setSelectedGroup(null);
                            }} 
                        />
                    ))}
                </div>
             </div>
          )}

           {selectedSemester && (
             <div className="space-y-3 animate-slide-up">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Grupa</h3>
                {loadingGroups ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {[1, 2, 3, 4].map(i => (
                      <div 
                        key={i} 
                        className="px-5 py-2.5 rounded-full border border-border h-9 w-24 skeleton-shimmer"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-muted text-sm ml-1 animate-fade-in">Brak dostępnych grup dla wybranej kombinacji.</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
                      {groups.map(g => (
                          <SelectionPill 
                              key={g.id} 
                              label={g.name} 
                              active={selectedGroup?.id === g.id} 
                              onClick={() => setSelectedGroup(g)} 
                          />
                      ))}
                  </div>
                )}
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