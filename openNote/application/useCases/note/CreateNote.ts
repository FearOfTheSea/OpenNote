import { Note } from "../../../domain/entities/Note";
import { NoteRepository } from "../../repositories/NoteRepository";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface CreateNoteInput {
    readonly name: string;
    readonly content: string;
    readonly folderId: string;
    readonly tagsId?: string[];
}

export interface CreateNoteOutput {
    readonly note: Note;
}

export class CreateNote {
    constructor(
        private noteRepository: NoteRepository,
        private folderRepository: FolderRepository,
        private tagRepository: TagRepository,
    ) {}

    async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
        const parentFolder = await this.folderRepository.findById(input.folderId);
        if (!parentFolder) {
            throw new Error(`Parent folder of note with id ${folderId} not found`);
        }

        for (const tagId of input.tagsId) {
            const foundTag = this.tagRepository.findById(tagId);
            if (!foundTag) {
                throw new Error(`Tag with id ${tagId} not found`);
            }
        }

        try {
            const note = new Note(
                input.name,
                input.content,
                input.folderId,
                input.tagsId,
            );
            await this.noteRepository.save(note);
            return { note };
        } catch (error) {
            throw error;
        }
    }
}
