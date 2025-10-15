import { Tag } from "../../domain/entities/Tag.ts";

export interface TagRepository {
    findAll(): Promise<Tag[]>;
    findById(id: string): Promise<Tag | null>;
    save(tag: Tag): Promise<void>;
    delete(id: string): Promise<void>;
    searchByKeyword(keyword: string): Promise<Tag[]>;
}
