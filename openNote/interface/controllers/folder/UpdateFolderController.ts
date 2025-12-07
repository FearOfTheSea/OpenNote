import { UseCase } from "../../../application/core/UseCase.ts";

import {
  UpdateFolder,
  UpdateFolderInput,
  UpdateFolderOutput,
} from "../../../application/useCases/folder/UpdateFolder.ts";
import { GetFolderByIdResponse } from "./GetFolderByIdController.ts";
import { RetryUseCaseDecorator } from "../../../infrastructure/decorators/RetryUseCaseDecorator.ts";
import { IUnitOfWork } from "../../../application/ports/IUnitOfWork.ts";

export interface UpdateFolderRequest {
  readonly id: string;
  readonly newName: string;
  readonly newParentFolderId?: string;
}

export interface UpdateFolderResponse {
  readonly folder: GetFolderByIdResponse;
}

export class UpdateFolderController {
  private useCase: UseCase<UpdateFolderInput, UpdateFolderOutput>;

  constructor(createUnitOfWork: () => Promise<IUnitOfWork>) {
    const coreUseCase = new UpdateFolder(createUnitOfWork);
    this.useCase = new RetryUseCaseDecorator(coreUseCase, {
      maxRetries: 5,
      initialDelay: 500,
      useJitter: true,
    });
  }

  async apply(request: UpdateFolderRequest): Promise<UpdateFolderResponse> {
    const input = request as UpdateFolderInput;
    try {
      return (await this.useCase.execute(input)) as UpdateFolderResponse;
    } catch (error) {
      throw error;
    }
  }
}
