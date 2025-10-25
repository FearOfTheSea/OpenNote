import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";
import { GetAllFolders, GetAllFoldersInput } from "../../../application/useCases/folder/GetAllFolders.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";

export interface GetAllFoldersRequest {
    readonly userId: string;
}

export interface GetAllFoldersResponse {
    readonly folders: GetFolderByIdResponse[];
}

export class GetAllFoldersController {
    private useCase: GetAllFolders;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new GetAllFolders(folderRepository);
    }

    async apply(request: GetAllFoldersRequest): Promise<GetAllFoldersResponse> {
        return await this.useCase.execute(request as GetAllFoldersInput) as GetAllFoldersResponse;
    }
}
