import { GetNoteByIdResponse } from "../note/GetNoteByIdController.ts";
import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";
import {
    GetFolderContents,
    GetFolderContentsInput,
    GetFolderContentsOutput,
} from "../../../application/useCases/folder/GetFolderContents.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";

export interface GetFolderContentsRequest {
    readonly folderId: string;
}

export interface GetFolderContentsResponse {
    readonly folders: GetFolderByIdResponse[];
    readonly notes: GetNoteByIdResponse[];
}

export class GetFolderContentsController {
    private useCase: GetFolderContents;

    constructor(folderRepository: FolderRepository, private noteRepository: NoteRepository) {
        this.useCase = new GetFolderContents(folderRepository, noteRepository);
    }

    async apply(
        request: GetFolderContentsRequest,
    ): Promise<GetFolderContentsResponse> {
        const input = request as GetFolderContentsInput;
        const output: GetFolderContentsOutput = await this.useCase.execute(input);
        return {
            folders: output.folders as GetFolderByIdResponse[],
            notes: output.notes as GetNoteByIdResponse[],
        };
    }
}
