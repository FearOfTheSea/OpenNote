import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { Tag } from "../../domain/entities/Tag.ts";

export class InMemoryTagRepository implements TagRepository {
  private tags: Tag[] = [];

  async findById(id: string): Promise<Tag | null> {
    const tag = this.tags.find((n) => n.id === id);
    return tag || null;
  }

  async findAll(): Promise<Tag[]> {
    return this.tags;
  }

  async save(tag: Tag): Promise<void> {
    const existingTagIndex = this.tags.findIndex((n) => n.id === tag.id);

    if (existingTagIndex === -1) {
      this.tags.push(tag);
    } else {
      this.tags[existingTagIndex] = tag;
    }
  }

  async delete(id: string): Promise<void> {
    this.tags = this.tags.filter((tag) => tag.id !== id);
  }
}
