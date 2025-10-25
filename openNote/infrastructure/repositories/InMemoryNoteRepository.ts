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
            userNotes.concat(notesInFolder);
        }
        return userNotes;
    }

    async findById(id: string): Promise<Note | null> {
        const note = this.notes.find((n) => n.id === id);
        return note || null;
    }

    async findByFolderId(folderId: string): Promise<Note[]> {
        return this.notes.filter((note) => note.parentFolderId === folderId);
    }

    async findByTagsIds(tagIds: string[], userId: string): Promise<Note[]> {
        const allNotes = this.findAll(userId);
        return (await allNotes).filter((note) => {
            return tagIds.every((tag) => note.tagIds.includes(tag));
        });
    }

    async cutNote(noteId: string, newFolderId: string): Promise<boolean> {
        const note = await this.findById(noteId);
        if (!note) {
            return false;
        }

        const newNote = {
            ...note,
            parentFolderId: newFolderId,
        };

        this.notes.push(newNote);

        const oldNoteIndex = this.notes.findIndex((n) => n.id === noteId);
        if (oldNoteIndex !== -1) {
            this.notes.splice(oldNoteIndex, 1);
        }
        return true;
    }

    async save(note: Note): Promise<void> {
        const existingNoteIndex = this.notes.findIndex((n) => n.id === note.id);

        if (existingNoteIndex === -1) {
            this.notes.push(note);
        } else {
            this.notes[existingNoteIndex] = note;
        }
    }

    async delete(id: string): Promise<void> {
        this.notes = this.notes.filter((note) => note.id !== id);
    }

    async searchByKeyword(keyword: string, userId: string): Promise<Note[]> {
        return this.notes.filter(async (note) => {
            const matchingKeyword = note.name.includes(keyword.trim());
            const matchingUser = (await this.folderRepository.findById(note.parentFolderId))?.userId === userId;
            return matchingKeyword && matchingUser;
        });
    }
}
