import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
    findAll(): Promise<Tag[]>;
    findByName(name: string): Promise<Tag>;
    save(tag: Tag): Promise<void>;
    delete(id: string): Promise<void>;
}
