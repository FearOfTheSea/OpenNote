import {Tag} from "../../domain/entities/Tag";

export interface TagRepository {
    findById(id: string): Promise<Tag | null>;
    findAll(): Promise<Tag[]>;
    save(tag: Tag): Promise<void>;
    delete(id: string): Promise<void>;
}