import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
    findById(id: string): Promise<Tag | null>;
    findByName(name: string): Promise<Tag[]>;
    findAll(): Promise<Tag[]>;
    save(tag: Tag): Promise<void>;
    delete(id: string): Promise<void>;
}
