import { IUnitOfWork } from "../../../application/ports/IUnitOfWork.ts";
import { FolderRepository } from "../../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../../application/repositories/NoteRepository.ts";
import { UpdateNote, UpdateNoteInput } from "../../../application/useCases/note/UpdateNote.ts";
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
  private useCase: UpdateNote;

  constructor(
    folderRepository: FolderRepository,
    noteRepository: NoteRepository,
    createNoteUnitOfWork: () => Promise<IUnitOfWork>,
  ) {
    this.useCase = new UpdateNote(
      folderRepository,
      noteRepository,
      createNoteUnitOfWork,
    );
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
