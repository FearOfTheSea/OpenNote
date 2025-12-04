import { IUnitOfWork } from "../../../application/ports/IUnitOfWork.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import {
  CreateNote,
  CreateNoteInput,
} from "../../../application/useCases/note/CreateNote.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

export interface CreateNoteRequest {
  readonly name: string;
  readonly content: string;
  readonly parentFolderId: string;
}

export interface CreateNoteResponse {
  readonly note: GetNoteByIdResponse;
}

export class CreateNoteController {
  private useCase: CreateNote;

  constructor(
    folderRepository: FolderRepository,
    createNoteUnitOfWork: () => Promise<IUnitOfWork>
  ) {
    this.useCase = new CreateNote(folderRepository, createNoteUnitOfWork);
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
