import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface UpdateNoteInput {
    readonly id: string;
    readonly name?: string;
    readonly content?: string;
    readonly parentFolderId?: string;
    readonly tagsIds?: string[];
    readonly attachmentsIds?: string[];
}

export interface UpdateNoteOutput {
    readonly note: Note;
}

export class UpdateNote {
    constructor(
        private noteRepository: NoteRepository,
        private folderRepository: FolderRepository,
        private tagRepository: TagRepository,
    ) {}

    async execute(input: UpdateNoteInput): Promise<UpdateNoteOutput> {
        const existingNote = await this.noteRepository.findById(input.id);
        if (!existingNote) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        if (input.parentFolderId) {
            if (!await this.folderRepository.findById(input.parentFolderId)) {
                throw new Error(`Parent folder with id ${input.parentFolderId} not found`);
            }
        }

        if (input.tagsIds) {
            for (const tagId of input.tagsIds) {
                if (!await this.tagRepository.findById(tagId)) {
                    throw new Error(`Tag with id ${tagId} not found`);
                }
            }
        }

        const updatedNote = new Note(
            input.name ? input.name : existingNote.name,
            input.content !== undefined ? input.content : existingNote.content,
            input.parentFolderId ? input.parentFolderId : existingNote.parentFolderId,
            input.tagsIds ? input.tagsIds : existingNote.tagsIds,
            input.attachmentsIds ? input.attachmentsIds : existingNote.attachmentsIds,
        );

        await this.noteRepository.save(updatedNote);
        return { note: updatedNote };
    }
}
