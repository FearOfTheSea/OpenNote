import { GetAllTags, GetAllTagsInput } from "../../../application/useCases/tag/GetAllTags.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface TagViewObject {
    readonly id: string;
    readonly name: string;
}

export interface GetAllTagsRequest {
    readonly userId: string;
}

export interface GetAllTagsResponse {
    readonly tags: TagViewObject[];
}

export class GetAllTagsController {
    private useCase: GetAllTags;

    constructor(tagRepository: TagRepository) {
        this.useCase = new GetAllTags(tagRepository);
    }

    async apply(request: GetAllTagsRequest): Promise<GetAllTagsResponse> {
        return await this.useCase.execute(request as GetAllTagsInput) as GetAllTagsResponse;
    }
}
