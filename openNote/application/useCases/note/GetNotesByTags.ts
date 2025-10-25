import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface GetNotesByTagInput {
    readonly userId: string;
    readonly tagIds: string[];
}

export interface GetNotesByTagOutput {
    readonly notes: Note[];
}

export class GetNotesByTags {
    constructor(private noteRepository: NoteRepository, private tagRepository: TagRepository) {}

    async execute(input: GetNotesByTagInput): Promise<GetNotesByTagOutput> {
        const allTags = await this.tagRepository.findAll(input.userId);
        for (const tagId of input.tagIds) {
            if (!allTags?.find((tag) => tag.id === tagId)) {
                throw new Error(`Tag with id ${tagId} not found`);
            }
        }
        return await this.noteRepository
            .findByTagsIds(input.tagIds, input.userId)
            .then((notes) => ({ notes }));
    }
}
