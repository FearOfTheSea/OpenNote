import { DeleteTag, DeleteTagInput } from "../../../application/useCases/tag/DeleteTag.ts";
import { TagRepository } from "../../../application/repositories/TagRepository.ts";

export interface DeleteTagRequest {
    id: string;
}

export class DeleteTagController {
    private useCase: DeleteTag;

    constructor(tagRepository: TagRepository) {
        this.useCase = new DeleteTag(tagRepository);
    }

    async apply(request: DeleteTagRequest): Promise<void> {
        const input = request as DeleteTagInput;
        await this.useCase.execute(input);
    }
}