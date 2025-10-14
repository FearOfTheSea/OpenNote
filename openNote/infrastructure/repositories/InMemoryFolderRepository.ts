import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { Folder } from "../../domain/entities/Folder.ts";

export class InMemoryFolderRepository implements FolderRepository {
    private folders: Folder[] = [];

    async findById(id: string): Promise<Folder | null> {
        const note = this.folders.find((n) => n.id === id);
        return note || null;
    }

    async findAll(): Promise<Folder[]> {
        return this.folders;
    }

    async save(note: Folder): Promise<void> {
        const existingFolderIndex = this.folders.findIndex((n) => n.id === note.id);

        if (existingFolderIndex === -1) {
            this.folders.push(note);
        } else {
            this.folders[existingFolderIndex] = note;
        }
    }

    async delete(id: string): Promise<void> {
        this.folders = this.folders.filter((note) => note.id !== id);
    }

    async findByName(name: string): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.name === name);
    }

    async findByParentFolderId(parentFolderId: string | undefined): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.parentFolderId === parentFolderId);
    }

    async searchByKeyword(keyword: string): Promise<Folder[]> {
        const searchRecursive = (parentFolderId: string | undefined): Folder[] => {
            const result = this.folders.filter((folder) =>
                folder.name.toLowerCase().includes(keyword.toLowerCase()) &&
                folder.parentFolderId === parentFolderId
            );

            this.folders
                .filter((folder) => folder.parentFolderId === parentFolderId)
                .forEach((folder) => {
                    result.push(...searchRecursive(folder.id));
                });

            return result;
        };
        return searchRecursive(undefined);
    }
}
