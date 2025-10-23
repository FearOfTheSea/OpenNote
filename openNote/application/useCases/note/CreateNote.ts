import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
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
        if (!await this.folderRepository.findById(input.folderId)) {
            throw new Error(`Folder with id ${input.folderId} not found`);
        }

        if (input.tagsId) {
            for (const tagId of input.tagsId) {
                const foundTag = await this.tagRepository.findById(tagId);
                if (!foundTag) {
                    throw new Error(`Tag with id ${tagId} not found`);
                }
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
