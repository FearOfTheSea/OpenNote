import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import {
  GetFolderById,
  GetFolderByIdInput,
  GetFolderByIdOutput,
} from "../../../application/useCases/folder/GetFolderById.ts";

export interface GetFolderByIdRequest {
  readonly id: string;
}

export interface GetFolderByIdResponse {
  readonly id?: string;
  readonly name: string;
  readonly parentFolderId?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export class GetFolderByIdController {
  private useCase: GetFolderById;

  constructor(folderRepository: FolderRepository) {
    this.useCase = new GetFolderById(folderRepository);
  }

  async apply(request: GetFolderByIdRequest): Promise<GetFolderByIdResponse> {
    const input: GetFolderByIdInput = { id: request.id };
    try {
      const output: GetFolderByIdOutput = await this.useCase.execute(input);
      return {
        id: output.folder.id,
        name: output.folder.name,
        parentFolderId: output.folder.parentFolderId,
        createdAt: output.folder.createdAt,
        updatedAt: output.folder.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }
}
