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
  readonly id: string;
  readonly name: string;
  readonly userId: string;
  readonly parentFolderId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class GetFolderByIdController {
  private useCase: GetFolderById;

  constructor(folderRepository: FolderRepository) {
    this.useCase = new GetFolderById(folderRepository);
  }

  async apply(request: GetFolderByIdRequest): Promise<GetFolderByIdResponse> {
    const input = request as GetFolderByIdInput;
    try {
      const output: GetFolderByIdOutput = await this.useCase.execute(input);
      return output.folder as GetFolderByIdResponse;
    } catch (error) {
      throw error;
    }
  }
}
