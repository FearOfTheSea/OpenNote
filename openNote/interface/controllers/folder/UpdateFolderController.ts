import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import {
  UpdateFolder,
  UpdateFolderInput,
} from "../../../application/useCases/folder/UpdateFolder.ts";
import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";

export interface UpdateFolderRequest {
  readonly id: string;
  readonly name?: string;
  readonly folderId?: string;
}

export interface UpdateFolderResponse {
  readonly folder: GetFolderByIdResponse;
}

export class UpdateFolderController {
  private useCase: UpdateFolder;

  constructor(folderRepository: FolderRepository) {
    this.useCase = new UpdateFolder(folderRepository);
  }

  async apply(request: UpdateFolderRequest): Promise<UpdateFolderResponse> {
    const input = request as UpdateFolderInput;
    try {
      return (await this.useCase.execute(input))
        .folder as GetFolderByIdResponse;
    } catch (error) {
      throw error;
    }
  }
}
