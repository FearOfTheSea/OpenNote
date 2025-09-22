import { Note } from "../domain/entities";

export interface CreateNoteRequest {
    name: string;
    content: string;
    folderId?: string;
    tagsId: string[];
}

export interface CreateNoteResponse {
    note: Note;
}

export interface UpdateNoteRequest {
    id: string;
    name?: string;
    content?: string;
    folderId?: string;
    tagsId?: string[];
}

export interface UpdateNoteResponse {
    note: Note;
}

export interface GetNoteRequest {
    id: string;
}

export interface GetNoteResponse {
    note: Note | null;
}

export interface ListNotesResponse {
    notes: Note[];
}

export interface DeleteNoteRequest {
    id: string;
}

export interface DeleteNoteResponse {
    success: boolean;
}

export interface CreateNoteUseCase {
    execute(request: CreateNoteRequest): Promise<CreateNoteResponse>;
}

export interface UpdateNoteUseCase {
    execute(request: UpdateNoteRequest): Promise<UpdateNoteResponse>;
}

export interface GetNoteUseCase {
    execute(request: GetNoteRequest): Promise<GetNoteResponse>;
}

export interface ListNotesUseCase {
    execute(): Promise<ListNotesResponse>;
}

export interface DeleteNoteUseCase {
    execute(request: DeleteNoteRequest): Promise<DeleteNoteResponse>;
}
