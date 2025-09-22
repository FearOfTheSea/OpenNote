import { Note } from "../domain/entities";
import { NoteRepository } from "../domain/repositories";
import {
    CreateNoteRequest, CreateNoteResponse, CreateNoteUseCase,
    UpdateNoteRequest, UpdateNoteResponse, UpdateNoteUseCase,
    GetNoteRequest, GetNoteResponse, GetNoteUseCase,
    ListNotesResponse, ListNotesUseCase,
    DeleteNoteRequest, DeleteNoteResponse, DeleteNoteUseCase
} from "./noteUseCases";

export class CreateNoteUseCaseImpl implements CreateNoteUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(request: CreateNoteRequest): Promise<CreateNoteResponse> {
        const note: Note = {
            id: crypto.randomUUID(),
            name: request.name,
            content: request.content,
            folderId: request.folderId,
            tagsId: request.tagsId,
        };
        await this.noteRepository.save(note);
        return { note };
    }
}

// Update
export class UpdateNoteUseCaseImpl implements UpdateNoteUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(request: UpdateNoteRequest): Promise<UpdateNoteResponse> {
        const existing = await this.noteRepository.findById(request.id);
        if (!existing) throw new Error("Note not found");

        const updated: Note = {
            ...existing,
            ...request,
        };

        await this.noteRepository.save(updated);
        return { note: updated };
    }
}

export class GetNoteUseCaseImpl implements GetNoteUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(request: GetNoteRequest): Promise<GetNoteResponse> {
        const note = await this.noteRepository.findById(request.id);
        return { note };
    }
}

export class ListNotesUseCaseImpl implements ListNotesUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(): Promise<ListNotesResponse> {
        const notes = await this.noteRepository.findAll();
        return { notes };
    }
}

export class DeleteNoteUseCaseImpl implements DeleteNoteUseCase {
    constructor(private readonly noteRepository: NoteRepository) {}

    async execute(request: DeleteNoteRequest): Promise<DeleteNoteResponse> {
        const existing = await this.noteRepository.findById(request.id);
        if (!existing) return { success: false };

        await this.noteRepository.delete(request.id);
        return { success: true };
    }
}
