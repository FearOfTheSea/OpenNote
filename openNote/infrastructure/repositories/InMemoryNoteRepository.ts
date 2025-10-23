import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { Note } from "../../domain/entities/Note.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";

export class InMemoryNoteRepository implements NoteRepository {
    private notes: Note[] = [];

    constructor(private readonly folderRepository: FolderRepository) {
    }

    findByTag(tag: string, userId: string): Promise<Note[]> {
        throw new Error("Method not implemented.");
    }

    copyNote(noteId: string, targetFolderId: string): Promise<Note> {
        throw new Error("Method not implemented.");
    }

    cutNote(noteId: string, newFolderId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async findAll(): Promise<Note[]> {
        return this.notes;
    }

    async findById(id: string): Promise<Note | null> {
        const note = this.notes.find((n) => n.id === id);
        return note || null;
    }

    async findByFolderId(folderId: string): Promise<Note[]> {
        return this.notes.filter((note) => note.parentFolderId === folderId);
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
            const folder = await this.folderRepository.findById(note.parentFolderId);
            return note.name.includes(keyword.trim()) && folder?.userId === userId;
        });
    }

    async findNotesByTagsIds(tagsIds: string[]): Promise<Note[]> {
        return this.notes.filter((note) => tagsIds.every((tagId) => note.tagsIds.includes(tagId)));
    }
}
