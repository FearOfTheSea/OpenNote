import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { Note } from "../../domain/entities/Note.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";

export class InMemoryNoteRepository implements NoteRepository {
    private notes: Note[] = [];

    constructor(private readonly folderRepository: FolderRepository) {
    }

    async checkExistenceByName(name: string, folderId: string): Promise<boolean> {
        const notes = await this.findByFolderId(folderId);
        if (notes.find((note) => note.name === name)) {
            return true;
        }
        return false;
    }

    async findAll(userId: string): Promise<Note[]> {
        const userFolders = await this.folderRepository.findAll(userId);
        const userNotes: Note[] = [];
        for (const folder of userFolders) {
            const notesInFolder = await this.findByFolderId(folder.id);
            userNotes.push(...notesInFolder);
        }
        return userNotes;
    }

    findById(id: string): Promise<Note | null> {
        const note = this.notes.find((n) => n.id === id);
        return Promise.resolve(note || null);
    }

    findByFolderId(folderId: string): Promise<Note[]> {
        return Promise.resolve(this.notes.filter((note) => note.parentFolderId === folderId));
    }

    async findByTagsIds(tagIds: string[], userId: string): Promise<Note[]> {
        const allNotes = await this.findAll(userId);
        return allNotes.filter((note) => {
            return tagIds.every((tag) => note.tagIds.includes(tag));
        });
    }

    async cutNote(noteId: string, newFolderId: string): Promise<boolean> {
        const note = await this.findById(noteId);
        if (!note) {
            return false;
        }

        const newNote = new Note(
            note.name,
            note.content,
            newFolderId,
            note.tagIds,
            note.id,
        );

        const oldNoteIndex = this.notes.findIndex((n) => n.id === noteId);
        if (oldNoteIndex !== -1) {
            this.notes[oldNoteIndex] = newNote;
        }
        return true;
    }

    save(note: Note): Promise<void> {
        const existingNoteIndex = this.notes.findIndex((n) => n.id === note.id);

        if (existingNoteIndex === -1) {
            this.notes.push(note);
        } else {
            this.notes[existingNoteIndex] = note;
        }
        return Promise.resolve();
    }

    delete(id: string): Promise<void> {
        const noteIndex = this.notes.findIndex((note) => note.id === id);
        if (noteIndex !== -1) {
            this.notes.splice(noteIndex, 1);
        }
        return Promise.resolve();
    }

    async searchByKeyword(keyword: string, userId: string): Promise<Note[]> {
        const trimmed = keyword.trim();
        const results: Note[] = [];

        for (const note of this.notes) {
            const parentFolder = await this.folderRepository.findById(note.parentFolderId);
            const matchingKeyword = note.name.includes(trimmed) || note.content.includes(trimmed);
            const matchingUser = parentFolder?.userId === userId;
            const pass = matchingKeyword && matchingUser;

            if (pass) results.push(note);
        }

        return results;
    }
}
