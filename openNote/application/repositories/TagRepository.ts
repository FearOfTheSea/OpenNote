import { Note } from "../../domain/entities/Note.ts";
import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
    findByName(name: string): Promise<Note[]>;
    findAll(): Promise<string[] | null>;
    save(tag: Tag): Promise<void>;
    delete(id: string): Promise<void>;
}
