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
        private unitOfWork: IUnitOfWork,
    ) {}

    async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
        if (!(await this.folderRepository.findById(input.parentFolderId))) {
            throw new Error(`Folder with id ${input.parentFolderId} not found`);
        }

        try {
            await this.unitOfWork.begin();
            const note = new Note(input.name, input.content, input.parentFolderId, input.tagIds);
            await this.unitOfWork.notes.save(note);
            await this.unitOfWork.tags.syncTagsForNoteUpdate(note.id, note.content);
            await this.unitOfWork.commit();
            return { note };
        } catch (error) {
            await this.unitOfWork.rollback();
            throw error;
        }
    }
}
