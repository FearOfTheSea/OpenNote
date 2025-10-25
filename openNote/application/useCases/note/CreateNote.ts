import { Note } from "../../../domain/entities/Note.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { IUnitOfWork } from "../../IUnitOfWork.ts";

export interface CreateNoteInput {
    readonly name: string;
    readonly content: string;
    readonly parentFolderId: string;
    readonly tagIds: string[];
}

export interface CreateNoteOutput {
    readonly note: Note;
}

export class CreateNote {
    constructor(
        private folderRepository: FolderRepository,
        private readonly createNoteUnitOfWork: () => IUnitOfWork,
    ) {}

    async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
        if (!(await this.folderRepository.findById(input.parentFolderId))) {
            throw new Error(`Folder with id ${input.parentFolderId} not found`);
        }

        const unitOfWork = this.createNoteUnitOfWork();
        try {
            await unitOfWork.begin();
            const note = new Note(
                input.name,
                input.content,
                input.parentFolderId,
                input.tagIds,
            );
            await unitOfWork.notes.save(note);
            await unitOfWork.tags.syncTagsForNoteUpdate(note.id, note.content);
            await unitOfWork.commit();
            return { note };
        } catch (error) {
            await unitOfWork.rollback();
            throw error;
        }
    }
}
