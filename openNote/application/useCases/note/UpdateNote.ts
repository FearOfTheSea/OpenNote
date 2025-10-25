import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { IUnitOfWork } from "../../IUnitOfWork.ts";

export interface UpdateNoteInput {
    readonly id: string;
    readonly name?: string;
    readonly content?: string;
    readonly parentFolderId?: string;
    readonly tagIds?: string[];
}

export interface UpdateNoteOutput {
    readonly note: Note;
}

export class UpdateNote {
    constructor(
        private folderRepository: FolderRepository,
        private noteRepository: NoteRepository,
        private readonly createNoteUnitOfWork: () => IUnitOfWork,
    ) {}

    async execute(input: UpdateNoteInput): Promise<UpdateNoteOutput> {
        const existingNote = await this.noteRepository.findById(input.id);
        if (!existingNote) {
            throw new Error(`Note with id ${input.id} not found`);
        }

        if (input.parentFolderId) {
            if (!(await this.folderRepository.findById(input.parentFolderId))) {
                throw new Error(
                    `Parent folder with id ${input.parentFolderId} not found`,
                );
            }
        }

        const updatedNote = new Note(
            input.name ? input.name : existingNote.name,
            input.content !== undefined ? input.content : existingNote.content,
            input.parentFolderId ? input.parentFolderId : existingNote.parentFolderId,
            input.tagIds ? input.tagIds : existingNote.tagIds,
        );

        const uow = this.createNoteUnitOfWork();

        try {
            await uow.begin();
            await uow.notes.save(updatedNote);
            await uow.tags.syncTagsForNoteUpdate(updatedNote.id, updatedNote.content);
            await uow.commit();
            return { note: updatedNote };
        } catch (error) {
            await uow.rollback();
            throw error;
        }
    }
}
