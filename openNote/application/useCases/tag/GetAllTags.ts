import { Tag } from "../../../domain/entities/Tag.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetAllTagsOutput {
    readonly tags: Tag[];
}

export class GetAllTags {
    constructor(private readonly tagRepository: TagRepository) {}

    async execute(): Promise<GetAllTagsOutput> {
        return { tags: await this.tagRepository.findAll() };
    }
}
