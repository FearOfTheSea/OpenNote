import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { Note } from "../../domain/entities/Note.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";

export class InMemoryNoteRepository implements NoteRepository {
    private notes: Note[] = [];

    constructor(private readonly folderRepository: FolderRepository) {
    }

    async findAll(): Promise<Note[]> {
        return this.notes;
    }

    async findById(id: string): Promise<Note | null> {
        const note = this.notes.find((n) => n.id === id);
        return note || null;
    }

    async findByFolderId(folderId: string): Promise<Note[]> {
        return this.notes.filter((note) => note.folderId === folderId);
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

    async searchByKeyword(keyword: string, folderId?: string): Promise<Note[]> {
        let notesToSearch: Note[] = this.notes;

        if (folderId) {
            const subfolders = await this.folderRepository.searchByKeyword("", folderId);
            const allFolderIds = [folderId, ...subfolders.map((folder) => folder.id)];
            notesToSearch = this.notes.filter((note) => allFolderIds.includes(note.folderId));
        }

        const keywordLower = keyword.toLowerCase();
        return notesToSearch.filter(
            (note) =>
                note.name.toLowerCase().includes(keywordLower) || note.content.toLowerCase().includes(keywordLower),
        );
    }

    async findNotesByTagsIds(tagsIds: string[]): Promise<Note[]> {
        return this.notes.filter((note) => tagsIds.every((tagId) => note.tagsId.includes(tagId)));
    }
}
