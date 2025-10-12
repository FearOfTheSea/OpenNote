import { NoteRepository } from "../../repositories/NoteRepository.ts";
import {
  UpdateNote,
  UpdateNoteInput,
  UpdateNoteOutput,
} from "../../../application/useCases/note/UpdateNote.ts";
import { GetNoteByIdResponse } from "./GetNoteByIdController.ts";

export interface UpdateNoteRequest {
  readonly id: string;
  readonly name?: string;
  readonly content?: string;
  readonly folderId?: string;
  readonly tagsId?: string[];
}

export interface UpdateNoteResponse {
  readonly note: GetNoteByIdResponse;
}

export class UpdateNoteController {
  private useCase: UpdateNote;

  constructor(noteRepository: NoteRepository) {
    this.useCase = new UpdateNote(noteRepository);
  }

  async apply(request: UpdateNoteRequest): Promise<UpdateNoteResponse> {
    const input: UpdateNoteInput = request as UpdateNoteInput;
    try {
      const output: UpdateNoteOutput = await this.useCase.execute(input);
      return {note: output.note as GetNoteByIdResponse};
    } catch (error) {
      throw error;
    }
  }
}
