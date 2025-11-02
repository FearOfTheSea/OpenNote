import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { Folder } from "../../domain/entities/Folder.ts";

export class InMemoryFolderRepository implements FolderRepository {
    private folders: Folder[] = [];

    constructor() {
        const newfolder1 = new Folder("newfolder1", "user", undefined);
        const newfolder2 = new Folder("newfolder2", "user", undefined);
        const newfolder3 = new Folder("newfolder3", "user", undefined);

        const subfolder1 = new Folder("subfolder1", "user", newfolder1.id);
        const subfolder2 = new Folder("subfolder2", "user", newfolder1.id);
        const subfolder3 = new Folder("subfolder3", "user", newfolder1.id);

        this.folders.push(newfolder1, newfolder2, newfolder3, subfolder1, subfolder2, subfolder3);
    }

    async findAll(userId: string): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.userId === userId);
    }

    async findById(id: string): Promise<Folder | null> {
        const folder = this.folders.find((folder) => folder.id === id);
        return folder ? folder : null;
    }

    async findByName(name: string, userId: string): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.name.includes(name.trim()) && folder.userId === userId);
    }

    async findByParentFolderId(parentFolderId: string | undefined, userId: string): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.parentFolderId === parentFolderId && folder.userId === userId);
    }

    async cutFolder(folderId: string, userId: string, newParentFolderId: string | undefined): Promise<boolean> {
        const folder = this.folders.find((f) => f.id === folderId);
        if (!folder) {
            return false;
        }

        const newFolder = new Folder(
            folder.name,
            folder.userId,
            newParentFolderId,
            folder.id,
        );

        const oldFolderIndex = this.folders.findIndex((f) => f.id === folderId);
        if (oldFolderIndex !== -1) {
            this.folders[oldFolderIndex] = newFolder;
        }

        return true;
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
        // Find all subfolders recursively
        const foldersToDelete = new Set<string>([id]);
        let foundNew = true;
        
        while (foundNew) {
            foundNew = false;
            for (const folder of this.folders) {
                if (folder.parentFolderId && foldersToDelete.has(folder.parentFolderId) && !foldersToDelete.has(folder.id)) {
                    foldersToDelete.add(folder.id);
                    foundNew = true;
                }
            }
        }
        
        // Delete all folders
        this.folders = this.folders.filter((folder) => !foldersToDelete.has(folder.id));
    }
}