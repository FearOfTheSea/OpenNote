import {NoteRepository} from '../application/repositories/NoteRepository';
import {Note} from '../domain/entities/Note';

export class InMemoryNoteRepository implements NoteRepository {
    private notes: Note[] = [];

    async findById(id: string): Promise<Note | null> {
        const note = this.notes.find(n => n.id === id);
        return note || null;
    }

    async findAll(): Promise<Note[]> {
        return this.notes;
    }

    async save(note: Note): Promise<void> {
        const existingNoteIndex = this.notes.findIndex(n => n.id === note.id);

        if (existingNoteIndex === -1) {
            this.notes.push(note);
        } else {
            this.notes[existingNoteIndex] = note;
        }
    }

    async delete(id: string): Promise<void> {
        this.notes = this.notes.filter(note => note.id !== id);
    }
}
