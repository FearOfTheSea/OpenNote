import { GetNoteByIdResponse } from "../note/GetNoteByIdController.ts";
import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";
import {
  GetFolderContents,
  GetFolderContentsOutput,
} from "../../../application/useCases/folder/GetFolderContents.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";

export interface GetFolderContentsRequest {
  readonly folderId?: string;
}

export interface GetFolderContentsResponse {
  readonly folders: GetFolderByIdResponse[];
  readonly notes: GetNoteByIdResponse[];
}

export class GetFolderContentsController {
  private useCase: GetFolderContents;

  constructor(folderRepository: FolderRepository) {
    this.useCase = new GetFolderContents(folderRepository);
  }

  async apply(
    request: GetFolderContentsRequest,
  ): Promise<GetFolderContentsResponse> {
    const input = request as GetFoldersContentInput;
    const output: GetFolderContentsOutput = await this.useCase.execute(input);
    return {
      folders: output.folders as GetFolderByIdResponse[],
      notes: output.notes as GetNoteByIdResponse[],
    };
  }
}
