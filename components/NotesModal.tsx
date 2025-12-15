import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, StickyNote, PenLine } from 'lucide-react';
import { Note, getNotes, saveNote, deleteNote } from '../services/notesService';
import Modal from './Modal';

interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectName: string;
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, onClose, subjectName }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && subjectName) {
            loadNotes();
        }
    }, [isOpen, subjectName]);

    const loadNotes = async () => {
        setIsLoading(true);
        const data = await getNotes(subjectName);
        setNotes(data);
        setIsLoading(false);
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        const note = await saveNote(subjectName, newNote.trim());
        if (note) {
            setNotes([note, ...notes]);
            setNewNote('');
        }
    };

    const handleDeleteNote = async (id: string) => {
        const success = await deleteNote(subjectName, id);
        if (success) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Notatki: ${subjectName}`}>
            <div className="flex flex-col h-full p-6">
                {/* Input Area */}
                <div className="mb-6 relative shrink-0">
                    <div className="absolute top-4 left-4 text-white/40 pointer-events-none">
                        <PenLine size={20} />
                    </div>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Dodaj nową notatkę..."
                        className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 pl-12 pr-14 text-white placeholder:text-white/60 focus:outline-none focus:bg-black/40 focus:border-primary/50 resize-none h-32 transition-all shadow-inner"
                    />
                    <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="absolute bottom-3 right-3 p-2.5 bg-primary text-black rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <StickyNote size={64} className="mb-4 opacity-50" />
                            <p className="font-medium">Brak notatek</p>
                            <p className="text-sm">Dodaj pierwszą notatkę powyżej</p>
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 group relative animate-fade-in hover:bg-white/[0.07] transition-colors">
                                <p className="text-sm text-main whitespace-pre-wrap leading-relaxed pr-8">{note.content}</p>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                    <span className="text-[10px] text-muted font-medium">
                                        {new Date(note.createdAt).toLocaleString('pl-PL', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="text-muted/50 hover:text-red-400 transition-colors p-2 absolute top-3 right-3 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default NotesModal;
