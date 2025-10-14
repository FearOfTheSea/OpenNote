import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { Folder } from "../../domain/entities/Folder.ts";

export class InMemoryFolderRepository implements FolderRepository {
    private folders: Folder[] = [];

    constructor() {
        const rootFolder = new Folder("root", undefined, true);
        this.folders.push(rootFolder);
    }

    async findById(id: string): Promise<Folder | null> {
        const folder = this.folders.find((n) => n.id === id);
        return folder ? folder : null;
    }

    async findAll(): Promise<Folder[]> {
        return this.folders;
    }

    async save(folder: Folder): Promise<void> {
        const existingFolderIndex = this.folders.findIndex((n) => n.id === folder.id);

        if (existingFolderIndex === -1) {
            this.folders.push(folder);
        } else {
            this.folders[existingFolderIndex] = folder;
        }
    }

    async delete(id: string): Promise<void> {
        this.folders = this.folders.filter((note) => note.id !== id);
    }

    async findByName(name: string): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.name === name);
    }

    async findByParentFolderId(
        parentFolderId: string | undefined,
    ): Promise<Folder[]> {
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
