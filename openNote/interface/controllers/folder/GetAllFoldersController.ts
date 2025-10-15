import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";
import { GetAllFolders } from "../../../application/useCases/folder/GetAllFolders.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";

export interface GetAllFoldersResponse {
    readonly folders: GetFolderByIdResponse[];
}

export class GetAllFoldersController {
    private useCase: GetAllFolders;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new GetAllFolders(folderRepository);
    }

    async apply(): Promise<GetAllFoldersResponse> {
        return await this.useCase.execute() as GetAllFoldersResponse;
    }
}
