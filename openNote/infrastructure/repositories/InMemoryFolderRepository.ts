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

    async findAll(): Promise<Folder[]> {
        return this.folders;
    }

    async findById(id: string): Promise<Folder | null> {
        const folder = this.folders.find((n) => n.id === id);
        return folder ? folder : null;
    }

    async findByUserId(userId: string): Promise<Folder[]> {
        return this.folders.filter((folder) => folder.userId === userId);
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

    // Search all folders whose name include the keyword in lowercase, if a parentFolderId is specified, search
    // through all the descendants of that folder
    async searchByKeyword(keyword: string, parentFolderId?: string): Promise<Folder[]> {
        const lowerKeyword = keyword.toLowerCase().trim();

        if (!parentFolderId) {
            return this.folders.filter((folder) => folder.name.toLowerCase().includes(lowerKeyword));
        }

        const descendantIds = this.getAllDescendantIds(parentFolderId);
        return this.folders.filter((folder) =>
            descendantIds.has(folder.id) && folder.name.toLowerCase().includes(lowerKeyword)
        );
    }

    private getAllDescendantIds(parentFolderId: string): Set<string> {
        const descendantIds = new Set<string>();
        const queue: string[] = [parentFolderId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = this.folders.filter((folder) => folder.parentFolderId === currentId);

            for (const child of children) {
                descendantIds.add(child.id);
                queue.push(child.id);
            }
        }

        return descendantIds;
    }
}
