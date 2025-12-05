import { UseCase } from "../../../application/core/UseCase.ts";
import { IUnitOfWork } from "../../../application/ports/IUnitOfWork.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import {
  UpdateNote,
  UpdateNoteInput,
  UpdateNoteOutput,
} from "../../../application/useCases/note/UpdateNote.ts";
import { RetryUseCaseDecorator } from "../../../infrastructure/decorators/RetryUseCaseDecorator.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

export interface UpdateNoteRequest {
  readonly id: string;
  readonly newName?: string;
  readonly newContent?: string;
  readonly newParentFolderId?: string;
}

export interface UpdateNoteResponse {
  readonly note: GetNoteByIdResponse;
}

export class UpdateNoteController {
  private useCase: UseCase<UpdateNoteInput, UpdateNoteOutput>;

  constructor(
    folderRepository: FolderRepository,
    noteRepository: NoteRepository,
    createNoteUnitOfWork: () => Promise<IUnitOfWork>
  ) {
    const coreUseCase = new UpdateNote(
      folderRepository,
      noteRepository,
      createNoteUnitOfWork
    );

    this.useCase = new RetryUseCaseDecorator(coreUseCase, {
      maxRetries: 3,
      initialDelay: 500,
      useJitter: true,
    });
  }

  async apply(request: UpdateNoteRequest): Promise<UpdateNoteResponse> {
    const input: UpdateNoteInput = request as UpdateNoteInput;
    try {
      return (await this.useCase.execute(input)) as UpdateNoteResponse;
    } catch (error) {
      throw error;
    }
  }
}
