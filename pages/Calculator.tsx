import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Trophy, X, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { getEventsForGroup, MOCK_SCHEDULE } from '../services/mockData';

// --- Interfaces ---
interface SubjectEntry {
  id: string;
  name: string;
  grades: number[];
}

interface ConfirmState {
    isOpen: boolean;
    type: 'delete_subject' | 'delete_grade' | null;
    itemId?: string; // Subject ID
    gradeIndex?: number;
    title: string;
    message: string;
}

interface ToastState {
    show: boolean;
    message: string;
    type: 'success' | 'error';
}

// --- Custom Components ---

// 1. Custom Dropdown
const CustomSelect: React.FC<{
    options: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}> = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-[52px] bg-background border border-border rounded-xl px-4 flex items-center justify-between text-sm outline-none transition-all ${isOpen ? 'border-primary ring-1 ring-primary/20' : ''}`}
            >
                <span className={value ? 'text-main font-medium' : 'text-muted'}>
                    {value || placeholder}
                </span>
                <ChevronDown size={18} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-slide-down">
                    {options.length === 0 ? (
                        <div className="p-4 text-xs text-muted text-center">Brak dostępnych przedmiotów</div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left px-4 py-3 text-sm border-b border-border/50 last:border-0 hover:bg-hover transition-colors flex items-center justify-between ${value === option ? 'bg-primary/5 text-primary font-bold' : 'text-main'}`}
                            >
                                {option}
                                {value === option && <Check size={14} />}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// 2. Confirmation Modal
const ConfirmModal: React.FC<{
    state: ConfirmState;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ state, onConfirm, onCancel }) => {
    if (!state.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-slide-up">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-main">{state.title}</h3>
                        <p className="text-sm text-muted mt-1">{state.message}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        <button 
                            onClick={onCancel}
                            className="py-2.5 rounded-xl border border-border text-main font-bold text-sm hover:bg-hover transition-colors"
                        >
                            Anuluj
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors"
                        >
                            Usuń
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. Toast Notification
const Toast: React.FC<{ state: ToastState }> = ({ state }) => {
    if (!state.show) return null;
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up w-auto">
            <div className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border ${state.type === 'success' ? 'bg-surface border-green-500/30 text-green-500' : 'bg-surface border-red-500/30 text-red-500'}`}>
                {state.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span className="text-sm font-bold">{state.message}</span>
            </div>
        </div>
    );
};


const CalculatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [average, setAverage] = useState(0);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // UI States
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
      isOpen: false, type: null, title: '', message: ''
  });
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  // Load Schedule to populate subjects list
  useEffect(() => {
    const savedGroup = localStorage.getItem('selectedGroup');
    let subList: string[] = [];

    if (savedGroup) {
      const groupCode = JSON.parse(savedGroup).group;
      const events = getEventsForGroup(groupCode);
      subList = Array.from(new Set(events.map(e => e.subject)));
    } else {
      subList = Array.from(new Set(MOCK_SCHEDULE.map(e => e.subject)));
    }
    subList.sort();
    setAvailableSubjects(subList);
  }, []);

  // Load Saved Subjects
  useEffect(() => {
      const saved = localStorage.getItem('user-grades-v2');
      if (saved) setSubjects(JSON.parse(saved));
  }, []);

  // Calculate Average & Save
  useEffect(() => {
      if (subjects.length === 0) {
          setAverage(0);
      } else {
          let sumOfAverages = 0;
          let countOfSubjectsWithGrades = 0;

          subjects.forEach(sub => {
              if (sub.grades.length > 0) {
                  const subSum = sub.grades.reduce((a, b) => a + b, 0);
                  const subAvg = subSum / sub.grades.length;
                  sumOfAverages += subAvg;
                  countOfSubjectsWithGrades++;
              }
          });

          setAverage(countOfSubjectsWithGrades > 0 ? sumOfAverages / countOfSubjectsWithGrades : 0);
      }
      localStorage.setItem('user-grades-v2', JSON.stringify(subjects));
  }, [subjects]);

  // --- Actions ---

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  };

  const handleAddSubject = () => {
      if (!selectedSubject) return;
      if (subjects.some(i => i.name === selectedSubject)) {
          showToast("Przedmiot już istnieje", "error");
          return;
      }
      const newSubject: SubjectEntry = {
          id: Date.now().toString(),
          name: selectedSubject,
          grades: []
      };
      setSubjects([...subjects, newSubject]);
      setSelectedSubject('');
      showToast("Dodano przedmiot");
  };

  const initiateDeleteSubject = (id: string) => {
      setConfirmDialog({
          isOpen: true,
          type: 'delete_subject',
          itemId: id,
          title: 'Usuń przedmiot',
          message: 'Czy na pewno chcesz usunąć ten przedmiot i wszystkie jego oceny?'
      });
  };

  const initiateDeleteGrade = (subjectId: string, index: number) => {
      setConfirmDialog({
          isOpen: true,
          type: 'delete_grade',
          itemId: subjectId,
          gradeIndex: index,
          title: 'Usuń ocenę',
          message: 'Czy chcesz usunąć tę ocenę?'
      });
  };

  const confirmAction = () => {
      if (confirmDialog.type === 'delete_subject' && confirmDialog.itemId) {
          setSubjects(subjects.filter(i => i.id !== confirmDialog.itemId));
          showToast("Usunięto przedmiot");
      } else if (confirmDialog.type === 'delete_grade' && confirmDialog.itemId && confirmDialog.gradeIndex !== undefined) {
          setSubjects(subjects.map(sub => {
            if (sub.id === confirmDialog.itemId) {
                const newGrades = [...sub.grades];
                newGrades.splice(confirmDialog.gradeIndex!, 1);
                return { ...sub, grades: newGrades };
            }
            return sub;
          }));
          showToast("Usunięto ocenę");
      }
      setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  const handleAddGrade = (subjectId: string, grade: number) => {
      setSubjects(subjects.map(sub => {
          if (sub.id === subjectId) {
              return { ...sub, grades: [...sub.grades, grade] };
          }
          return sub;
      }));
      showToast(`Dodano ocenę ${grade.toFixed(1)}`);
  };

  // --- Helpers ---
  const getGradeColor = (grade: number) => {
      if (grade >= 4.5) return 'bg-green-500/10 text-green-500 border-green-500/20';
      if (grade >= 3.5) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      if (grade >= 3.0) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const calculateSubjectAverage = (grades: number[]) => {
      if (grades.length === 0) return 0;
      return grades.reduce((a,b) => a+b, 0) / grades.length;
  };

  return (
      <div className="space-y-8 animate-fade-in pt-6 pb-24 relative">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-main transition-colors">
                <ChevronLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-display font-bold text-main">Średnia</h1>
                <p className="text-muted text-xs">Kalkulator bez wag (średnia arytmetyczna)</p>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-surface rounded-3xl p-8 border border-border relative overflow-hidden flex flex-col items-center justify-center text-center shadow-lg transition-colors duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-500"></div>
              
              <div className="mb-2">
                 <span className="text-sm text-muted uppercase tracking-widest font-bold">Twoja Średnia</span>
              </div>
              <div className="text-6xl font-display font-bold text-main mb-4 tracking-tighter transition-all">
                  {average.toFixed(2)}
              </div>

              {/* Progress to Scholarship */}
              <div className="w-full max-w-[200px] space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                      <span>Start</span>
                      <span>Stypendium (4.5)</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden border border-border">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${average >= 4.5 ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min((average / 5.0) * 100, 100)}%` }}
                      ></div>
                  </div>
                  {average >= 4.5 && (
                      <div className="flex items-center justify-center gap-1.5 text-green-500 text-xs font-bold mt-2 animate-bounce">
                          <Trophy size={14} />
                          <span>Kwalifikujesz się!</span>
                      </div>
                  )}
              </div>
          </div>

          {/* Add Subject Section - Fixed Layout */}
          <div className="bg-surface rounded-2xl p-5 border border-border space-y-4">
              <h2 className="text-xs font-bold text-muted uppercase ml-1">Dodaj Przedmiot</h2>
              <div className="flex items-end gap-3">
                  <div className="flex-1">
                      <CustomSelect 
                          options={availableSubjects}
                          value={selectedSubject}
                          onChange={setSelectedSubject}
                          placeholder="Wybierz przedmiot..."
                      />
                  </div>
                  <button 
                    onClick={handleAddSubject}
                    disabled={!selectedSubject}
                    className="h-[52px] w-[52px] bg-primary text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center shrink-0 shadow-lg"
                  >
                      <Plus size={24} />
                  </button>
              </div>
          </div>

          {/* List of Subjects */}
          <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted uppercase ml-1">Twoje Oceny</h3>
              {subjects.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                      <p className="text-muted text-sm opacity-60">Dodaj przedmioty z listy powyżej</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-4">
                      {subjects.map(sub => {
                          const subAvg = calculateSubjectAverage(sub.grades);
                          
                          return (
                            <div key={sub.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm transition-all hover:border-primary/30 group animate-fade-in-up">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 border-b border-border/50 pb-3">
                                    <div className="pr-4">
                                        <h4 className="font-bold text-main leading-tight mb-1">{sub.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-muted uppercase">Średnia przedmiotu:</span>
                                            <span className={`text-sm font-bold ${subAvg >= 4.5 ? 'text-green-500' : 'text-primary'}`}>
                                                {subAvg > 0 ? subAvg.toFixed(2) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => initiateDeleteSubject(sub.id)} 
                                        className="text-muted hover:text-red-500 transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-hover"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                
                                {/* Grades List */}
                                <div className="flex flex-wrap gap-2 mb-4 min-h-[30px]">
                                    {sub.grades.length === 0 && (
                                        <span className="text-xs text-muted italic opacity-50">Brak ocen</span>
                                    )}
                                    {sub.grades.map((g, idx) => (
                                        <div key={idx} className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 ${getGradeColor(g)}`}>
                                            <span className="font-bold text-xs">{g.toFixed(1)}</span>
                                            <button onClick={() => initiateDeleteGrade(sub.id, idx)} className="hover:text-main">
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Grade Controls */}
                                <div className="mt-4 pt-3 border-t border-border/30">
                                    <span className="text-[10px] font-bold text-muted uppercase block mb-2 opacity-70">Dodaj ocenę</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[2.0, 3.0, 3.5, 4.0, 4.5, 5.0].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => handleAddGrade(sub.id, val)}
                                                className="flex items-center justify-center py-2.5 rounded-xl bg-background border border-border text-sm font-bold text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                                            >
                                                {val.toFixed(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              )}
          </div>

          {/* Overlays */}
          <ConfirmModal 
             state={confirmDialog} 
             onConfirm={confirmAction} 
             onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})} 
          />
          <Toast state={toast} />

      </div>
  );
};

export default CalculatorPage;