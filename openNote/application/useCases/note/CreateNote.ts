import { Note } from "../../../domain/entities/Note.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { IUnitOfWork } from "../../IUnitOfWork.ts";

export interface CreateNoteInput {
    readonly name: string;
    readonly content: string;
    readonly parentFolderId: string;
}

export interface CreateNoteOutput {
    readonly note: Note;
}

export class CreateNote {
    constructor(
        private readonly folderRepository: FolderRepository,
        private readonly createNoteUnitOfWork: () => IUnitOfWork,
    ) {}

    async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
        const parentFolder = await this.folderRepository.findById(input.parentFolderId);
        if (!parentFolder) {
            throw new Error(`Folder with id ${input.parentFolderId} not found`);
        }

        const unitOfWork = this.createNoteUnitOfWork();

        if ((await unitOfWork.notes.findAll(parentFolder.userId)).find((n) => n.name === input.name)) {
            throw new Error(`Note with name ${input.name} already exists in folder ${parentFolder.id}`);
        }

        try {
            await unitOfWork.begin();
            const note = new Note(
                input.name,
                input.content,
                input.parentFolderId,
            );
            await unitOfWork.notes.save(note);
            await unitOfWork.tags.syncTagsForNoteUpdate(note.id, note.content);
            await unitOfWork.commit();

            console.log(`[CreateNote] Created note with name = "${note.name}"`);
            return { note };
        } catch (error) {
            await unitOfWork.rollback();
            throw error;
        }
    }
}
