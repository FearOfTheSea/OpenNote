import {FolderRepository} from '../application/repositories/FolderRepository.ts';
import {Folder} from '../domain/entities/Folder.ts';

export class InMemoryFolderRepository implements FolderRepository {
    private folders: Folder[] = [];

    async findById(id: string): Promise<Folder | null> {
        const note = this.folders.find(n => n.id === id);
        return note || null;
    }

    async findAll(): Promise<Folder[]> {
        return this.folders;
    }

    async save(note: Folder): Promise<void> {
        const existingFolderIndex = this.folders.findIndex(n => n.id === note.id);

        if (existingFolderIndex === -1) {
            this.folders.push(note);
        } else {
            this.folders[existingFolderIndex] = note;
        }
    }

    async delete(id: string): Promise<void> {
        this.folders = this.folders.filter(note => note.id !== id);
    }
}