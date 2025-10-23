import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
    findAll(userId: string): Promise<Tag[] | null>;
    findById(id: string): Promise<Tag | null>;
    findByName(name: string): Promise<Tag[]>;
    save(tag: Tag, noteId: string): Promise<void>;
    delete(id: string): Promise<void>;
}
