import localforage from 'localforage';

export interface Note {
    id: string;
    content: string;
    createdAt: string;
}

export interface SubjectNotes {
    [subjectName: string]: Note[];
}

const NOTES_STORE_NAME = 'user-notes';

export const getNotes = async (subjectName: string): Promise<Note[]> => {
    try {
        const store = await localforage.getItem<SubjectNotes>(NOTES_STORE_NAME) || {};
        return store[subjectName] || [];
    } catch {
        return [];
    }
};

export const saveNote = async (subjectName: string, content: string): Promise<Note | null> => {
    try {
        const store = await localforage.getItem<SubjectNotes>(NOTES_STORE_NAME) || {};

        const newNote: Note = {
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString()
        };

        const subjectNotes = store[subjectName] || [];
        const updatedSubjectNotes = [newNote, ...subjectNotes]; // Newest first

        await localforage.setItem(NOTES_STORE_NAME, {
            ...store,
            [subjectName]: updatedSubjectNotes
        });

        return newNote;
    } catch {
        return null;
    }
};

export const deleteNote = async (subjectName: string, noteId: string): Promise<boolean> => {
    try {
        const store = await localforage.getItem<SubjectNotes>(NOTES_STORE_NAME) || {};
        const subjectNotes = store[subjectName] || [];

        const updatedSubjectNotes = subjectNotes.filter(n => n.id !== noteId);

        await localforage.setItem(NOTES_STORE_NAME, {
            ...store,
            [subjectName]: updatedSubjectNotes
        });

        return true;
    } catch {
        return false;
    }
};
