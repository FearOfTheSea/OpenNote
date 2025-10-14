import { Tag } from "../../domain/entities/Tag";

export interface TagRepository {
  findByName(name: string): Promise<Tag[]>; // Primary key is tag's name
  findAll(): Promise<Tag[]>;
  save(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
  //searchByKeyword(keyword: string): Promise<Tag[]>;
}
