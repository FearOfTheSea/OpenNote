import { GetTagById, GetTagByIdInput } from "../../../application/useCases/tag/GetTagById.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface GetTagByIdRequest {
    readonly id: string;
}

export interface GetTagByIdResponse {
    readonly id: string;
    readonly name: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}

export class GetTagByIdController {
    private useCase: GetTagById;

    constructor(tagRepository: TagRepository) {
        this.useCase = new GetTagById(tagRepository);
    }

    async apply(request: GetTagByIdRequest): Promise<GetTagByIdResponse> {
        const input = request as GetTagByIdInput;
        try {
            const output = await this.useCase.execute(input);
            return {
                id: output.tag.id,
                name: output.tag.name,
                createdAt: output.tag.createdAt,
                updatedAt: output.tag.updatedAt,
            };
        } catch (error) {
            throw error;
        }
    }
}
