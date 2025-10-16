import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface SearchTagsInput {
    query: string;
}

export interface SearchTagsOutput {
    tags: Tag[];
}

export class SearchTags {
    constructor(private tagRepository: TagRepository) {}

    async execute(input: SearchTagsInput): Promise<SearchTagsOutput> {
        return { tags: await this.tagRepository.searchByKeyword(input.query) };
    }
}
