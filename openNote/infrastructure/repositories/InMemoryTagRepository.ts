import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { Tag } from "../../domain/entities/Tag.ts";

export class InMemoryTagRepository implements TagRepository {
    private tags: Tag[] = [];

    async findAll(userId: string): Promise<Tag[]> {
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

    async syncTagsForNoteUpdate(noteId: string, noteContent: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async deleteOrphanedTag(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
