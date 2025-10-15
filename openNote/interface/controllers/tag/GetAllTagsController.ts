import { GetTagByIdResponse } from "./GetTagByIdController.ts";
import { GetAllTags } from "../../../application/useCases/tag/GetAllTags.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface GetAllTagsResponse {
    readonly tags: GetTagByIdResponse[];
}

export class GetAllTagsController {
    private useCase: GetAllTags;

    constructor(tagRepository: TagRepository) {
        this.useCase = new GetAllTags(tagRepository);
    }

    async apply(): Promise<GetAllTagsResponse> {
        return await this.useCase.execute() as GetAllTagsResponse;
    }
}
