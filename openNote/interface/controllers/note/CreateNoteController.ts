import { IUnitOfWork } from "../../../application/ports/IUnitOfWork.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { CreateNote, CreateNoteInput, CreateNoteOutput } from "../../../application/useCases/note/CreateNote.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";
import { UseCase } from "../../../application/core/UseCase.ts";
import { RetryUseCaseDecorator } from "../../../infrastructure/decorators/RetryUseCaseDecorator.ts";

export interface CreateNoteRequest {
  readonly name: string;
  readonly content: string;
  readonly parentFolderId: string;
}

export interface CreateNoteResponse {
  readonly note: GetNoteByIdResponse;
}

export class CreateNoteController {
  private useCase: UseCase<CreateNoteInput, CreateNoteOutput>;

  constructor(
    folderRepository: FolderRepository,
    createNoteUnitOfWork: () => Promise<IUnitOfWork>,
  ) {
    const coreUseCase = new CreateNote(folderRepository, createNoteUnitOfWork);

    this.useCase = new RetryUseCaseDecorator<CreateNoteInput, CreateNoteOutput>(
      coreUseCase,
      {
        maxRetries: 3,
        initialDelay: 500,
        useJitter: true,
      },
    );
  }

  async apply(request: CreateNoteRequest): Promise<CreateNoteResponse> {
    const input = request as CreateNoteInput;
    try {
      const output = await this.useCase.execute(input);
      return output as CreateNoteResponse;
    } catch (error) {
      throw error;
    }
  }
}
