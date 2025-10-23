import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetNotesByTagInput {
    readonly tagsId: string[];
}

export interface GetNotesByTagOutput {
    readonly notes: Note[];
}

export class GetNotesByTags {
    constructor(private noteRepository: NoteRepository, private tagRepository: TagRepository) {}

    async execute(input: GetNotesByTagInput): Promise<GetNotesByTagOutput> {
        const allNotes = await this.noteRepository.findAll();

        for (const tagId of input.tagsId) {
            if (!await this.tagRepository.findById(tagId)) {
                throw new Error(`Tag with id ${tagId} not found`);
            }
        }

        const filteredNotes = allNotes.filter((note) => input.tagsId.every((tagId) => note.tagsIds?.includes(tagId)));

        return { notes: filteredNotes };
    }
}
