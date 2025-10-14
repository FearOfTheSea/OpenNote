import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";
import { GetFolders, GetFoldersInput, GetFoldersOutput } from "../../../application/useCases/folder/GetFolders.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";

export interface GetFoldersRequest {
    readonly parentFolderId?: string;
}

export interface GetFoldersResponse {
    readonly folders: GetFolderByIdResponse[];
}

export class GetFoldersController {
    private useCase: GetFolders;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new GetFolders(folderRepository);
    }

    async apply(request: GetFoldersRequest): Promise<GetFoldersResponse> {
        const input = request as GetFoldersInput;
        const output: GetFoldersOutput = await this.useCase.execute(input);
        return { folders: output.folders as GetFolderByIdResponse[] };
    }
}
