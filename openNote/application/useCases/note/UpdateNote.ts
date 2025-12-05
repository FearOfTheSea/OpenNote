import { Note } from "../../../domain/entities/Note.ts";
import { NoteRepository } from "../../repositories/NoteRepository.ts";
import { FolderRepository } from "../../repositories/FolderRepository.ts";
import { IUnitOfWork } from "../../ports/IUnitOfWork.ts";
import { UseCase } from "../../core/UseCase.ts";

export interface UpdateNoteInput {
  readonly id: string;
  readonly newName?: string;
  readonly newContent?: string;
  readonly newParentFolderId?: string;
}

export interface UpdateNoteOutput {
  readonly note: Note;
}

export class UpdateNote implements UseCase<UpdateNoteInput, UpdateNoteOutput> {
  constructor(
    private folderRepository: FolderRepository,
    private noteRepository: NoteRepository,
    private readonly createNoteUnitOfWork: () => Promise<IUnitOfWork>
  ) {}

  async execute(input: UpdateNoteInput): Promise<UpdateNoteOutput> {
    const existingNote = await this.noteRepository.findById(input.id);
    if (!existingNote) {
      throw new Error(`Note with id ${input.id} not found`);
    }

    let newName = existingNote.name;
    if (input.newName) {
      newName = input.newName.trim();
    }

    if (input.newParentFolderId) {
      const parentFolder = await this.folderRepository.findById(
        input.newParentFolderId
      );
      if (!parentFolder) {
        throw new Error(
          `Parent folder with id ${input.newParentFolderId} not found`
        );
      }

      if (
        (await this.noteRepository.findByFolderId(parentFolder.id)).find(
          (n) => n.name === newName
        )
      ) {
        throw new Error(
          `Note with name ${newName} already exists in folder with id ${parentFolder.id}`
        );
      }
    } else if (input.newName) {
      if (
        (
          await this.noteRepository.findByFolderId(existingNote.parentFolderId)
        ).find((n) => n.name === newName)
      ) {
        throw new Error(
          `Note with name ${newName} already exists in folder with id ${existingNote.parentFolderId}`
        );
      }
    }

    const updatedNote = new Note(
      newName,
      input.newContent ? input.newContent : existingNote.content,
      input.newParentFolderId
        ? input.newParentFolderId
        : existingNote.parentFolderId,
      existingNote.tagIds,
      existingNote.id
    );

    const uow = await this.createNoteUnitOfWork();

    try {
      await uow.begin();
      await uow.notes.save(updatedNote);
      await uow.tags.syncTagsForNoteUpdate(updatedNote.id, updatedNote.content);
      await uow.commit();

      console.log(
        `Updated note: id: ${updatedNote.id}, name: ${updatedNote.name}, content: ${updatedNote.content}, parentFolderId: ${updatedNote.parentFolderId}, tags: ${updatedNote.tagIds}`
      );

      return { note: updatedNote };
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
