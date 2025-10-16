import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { Tag } from "../../domain/entities/Tag.ts";

export class InMemoryTagRepository implements TagRepository {
    private tags: Tag[] = [];

    async findAll(): Promise<Tag[]> {
        return await this.tags;
    }

    async findById(id: string): Promise<Tag | null> {
        const tag = await this.tags.find((n) => n.id === id);
        return tag || null;
    }

    async save(tag: Tag): Promise<void> {
        const existingTagIndex = await this.tags.findIndex((n) => n.id === tag.id);

        if (existingTagIndex === -1) {
            this.tags.push(tag);
        } else {
            this.tags[existingTagIndex] = tag;
        }
    }

    async delete(id: string): Promise<void> {
        this.tags = await this.tags.filter((tag) => tag.id !== id);
    }

    async searchByKeyword(keyword: string): Promise<Tag[]> {
        return await this.tags.filter((tag) => tag.name.toLowerCase().includes(keyword.toLowerCase()));
    }
}
