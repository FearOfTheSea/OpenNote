import { GetTagByIdResponse } from "./GetTagByIdController.ts";
import { UpdateTag, UpdateTagInput } from "../../../application/useCases/tag/UpdateTag.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface UpdateTagRequest {
    readonly id: string;
    readonly name: string;
}

export interface UpdateTagResponse {
    readonly tag: GetTagByIdResponse;
}

export class UpdateTagController {
    private useCase: UpdateTag;

    constructor(tagRepository: TagRepository) {
        this.useCase = new UpdateTag(tagRepository);
    }

    async apply(request: UpdateTagRequest): Promise<UpdateTagResponse> {
        const input = request as UpdateTagInput;
        try {
            return {
                tag: (await this.useCase.execute(input)).tag as GetTagByIdResponse,
            };
        } catch (error) {
            throw error;
        }
    }
}
