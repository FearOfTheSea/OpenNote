import { Folder } from "../../domain/entities/Folder";

export interface FolderRepository {
    findAll(): Promise<Folder[]>;
    findById(id: string): Promise<Folder | null>;
    findByUserId(userId: string): Promise<Folder[]>;
    save(folder: Folder): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string, parentFolderId?: string): Promise<Folder[]>;
}
