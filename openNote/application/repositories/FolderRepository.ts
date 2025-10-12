import {Folder} from "../../domain/entities/Folder";

export interface FolderRepository {
    findById(id: string): Promise<Folder | null>;
    findByName(name: string): Promise<Folder[]>;
    findByParentFolderId(parentFolderId: string | undefined): Promise<Folder[]>;
    findAll(): Promise<Folder[]>;
    save(folder: Folder): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string): Promise<Folder[]>;
}