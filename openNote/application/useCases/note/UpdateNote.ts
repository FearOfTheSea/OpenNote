import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { TagRepository } from "../../repositories/TagRepository.ts";

export interface UpdateNoteInput {
    readonly id: string;
    readonly name?: string;
    readonly content?: string;
    readonly folderId?: string;
    readonly tagsId?: string[];
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

        if (input.folderId) {
            if (!await this.folderRepository.findById(input.folderId)) {
                throw new Error(`Parent folder with id ${input.folderId} not found`);
            }
        }

        if (input.tagsId) {
            for (const tagId of input.tagsId) {
                if (!await this.tagRepository.findById(tagId)) {
                    throw new Error(`Tag with id ${tagId} not found`);
                }
            }
        }

        const updatedNote: Note = {
            id: input.id,
            name: input.name ? input.name : existingNote.name,
            content: input.content ? input.content : existingNote.content,
            folderId: input.folderId ? input.folderId : existingNote.folderId,
            tagsId: input.tagsId ? input.tagsId : existingNote.tagsId,
            createdAt: existingNote.createdAt,
            updatedAt: new Date(),
        };

        await this.noteRepository.save(updatedNote);
        return { note: updatedNote };
    }
}
