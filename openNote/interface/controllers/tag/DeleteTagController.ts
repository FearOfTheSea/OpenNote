import { DeleteTag, DeleteTagInput } from "../../../application/useCases/tag/DeleteTag.ts";

export interface DeleteTagRequest {
    id: string;
}

export class DeleteTagController {
    private useCase: DeleteTag;

    constructor(tagRepository: TagRepository) {
        this.useCase = new DeleteTag(tagRepository);
    }

    async apply(request: DeleteTagInput): Promise<void> {
        const input = request as DeleteTagInput;
        try {
            return await this.useCase.execute(input);
        } catch (error) {
            throw error;
        }
    }
}
