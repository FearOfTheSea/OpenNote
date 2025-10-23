import { Folder } from "../../domain/entities/Folder.ts";

export interface FolderRepository {
    findAll(): Promise<Folder[]>;
    findById(id: string): Promise<Folder | null>;
    findByName(name: string, userId: string): Promise<Folder[]>;
    findByParentFolderId(parentFolderId: string | undefined): Promise<Folder[]>;
    findParentFolders(userId: string): Promise<Folder[]>;
    cutFolder(folderId: string, newParentFolderId: string | undefined): Promise<boolean>;
    copyFolder(folderId: string, newParentFolderId: string | undefined): Promise<boolean>;
    save(folder: Folder): Promise<void>;
    delete(id: string): Promise<void>;
}
