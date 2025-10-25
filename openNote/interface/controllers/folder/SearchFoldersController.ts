import {
    SearchFolders,
    SearchFoldersInput,
    SearchFoldersOutput,
} from "../../../application/useCases/folder/SearchFolders.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";

export interface SearchFoldersRequest {
    readonly keyword: string;
    readonly userId: string;
}

export interface SearchFoldersResponse {
    readonly folders: GetFolderByIdResponse[];
}

export class SearchFoldersController {
    private useCase: SearchFolders;

    constructor(folderRepository: FolderRepository) {
        this.useCase = new SearchFolders(folderRepository);
    }

    async apply(request: SearchFoldersRequest): Promise<SearchFoldersResponse> {
        const input = request as SearchFoldersInput;
        try {
            const output: SearchFoldersOutput = await this.useCase.execute(input);
            return { folders: output.folders as GetFolderByIdResponse[] };
        } catch (error) {
            throw error;
        }
    }
}
