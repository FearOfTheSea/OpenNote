import { DeleteFolder, DeleteFolderInput } from "../../../application/useCases/folder/DeleteFolder.ts";

export interface DeleteFolderRequest {
    id: string;
}

export class DeleteFolderController {
    private useCase: DeleteFolder;

    constructor(useCase: DeleteFolder) {
        this.useCase = useCase;
    }

    async apply(request: DeleteFolderInput): Promise<void> {
        const input = request as DeleteFolderInput;
        try {
            return await this.useCase.execute(input);
        } catch (error) {
            throw error;
        }
    }
}
