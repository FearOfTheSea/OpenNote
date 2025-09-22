import { Note, Folder, Tag } from './entities';

export interface NoteRepository {
    findById(id: string): Promise<Note | null>;
    findAll(): Promise<Note[]>;
    save(note: Note): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface FolderRepository {
    findById(id: string): Promise<Folder | null>;
    findAll(): Promise<Folder[]>;
    save(folder: Folder): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface TagRepository {
    findById(id: string): Promise<Tag | null>;
    findAll(): Promise<Tag[]>;
    save(tag: Tag): Promise<void>;
    delete(id: string): Promise<void>;
}
