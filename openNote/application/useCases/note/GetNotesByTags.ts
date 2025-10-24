import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetNotesByTagInput {
  readonly userId: string;
  readonly tagsId: string[];
}

export interface GetNotesByTagOutput {
  readonly notes: Note[];
}

export class GetNotesByTags {
  constructor(private noteRepository: NoteRepository) {}

  async execute(input: GetNotesByTagInput): Promise<GetNotesByTagOutput> {
    return await this.noteRepository
      .findByTagsIds(input.tagsId, input.userId)
      .then((notes) => ({ notes }));
  }
}
