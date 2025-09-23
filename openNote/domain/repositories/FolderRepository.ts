import {Folder} from "../entities/Folder";

export interface FolderRepository {
    findById(id: string): Promise<Folder | null>;
    findAll(): Promise<Folder[]>;
    save(folder: Folder): Promise<void>;
    delete(id: string): Promise<void>;
}