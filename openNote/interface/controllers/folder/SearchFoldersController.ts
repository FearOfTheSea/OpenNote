import {
    SearchFolders,
    SearchFoldersInput,
    SearchFoldersOutput,
} from "../../../application/useCases/folder/SearchFolders.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";

export interface SearchFoldersRequest {
    readonly query: string;
    readonly parentFolderId?: string;
}

export interface SearchFoldersResponse {
    readonly folders: GetFolderByIdResponse[];
}

export class SearchFoldersController {
    private useCase: SearchFolders;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new GetFolderContents(folderRepository);
    }

    async apply(
        request: SearchFoldersRequest,
    ): Promise<SearchFoldersResponse> {
        const input = request as SearchFoldersInput;
        const output: SearchFoldersOutput = await this.useCase.execute(input);
        return {
            folders: output.folders as GetFolderByIdResponse[],
        };
    }
}
