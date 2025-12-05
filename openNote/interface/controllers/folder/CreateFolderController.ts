import {
  CreateFolder,
  CreateFolderInput,
  CreateFolderOutput,
} from "../../../application/useCases/folder/CreateFolder.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { UseCase } from "../../../application/core/UseCase.ts";
import { RetryUseCaseDecorator } from "../../../infrastructure/decorators/RetryUseCaseDecorator.ts";

export interface CreateFolderRequest {
  readonly name: string;
  readonly userId: string;
  readonly parentFolderId?: string;
}

export interface CreateFolderResponse {
  readonly id: string;
  readonly name: string;
  readonly userId: string;
  readonly parentFolderId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class CreateFolderController {
  private useCase: UseCase<CreateFolderInput, CreateFolderOutput>;

  constructor(folderRepository: FolderRepository) {
    const coreUseCase = new CreateFolder(folderRepository);
    this.useCase = new RetryUseCaseDecorator(coreUseCase, {
      maxRetries: 3,
      initialDelay: 500,
      useJitter: true,
    });
  }

  async apply(request: CreateFolderRequest): Promise<CreateFolderResponse> {
    const input = request as CreateFolderInput;
    try {
      return (await this.useCase.execute(input)).folder as CreateFolderResponse;
    } catch (error) {
      throw error;
    }
  }
}
