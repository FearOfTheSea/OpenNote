import { getFolderPath } from "./folder";
import { apiRequest } from "./http";

export interface GetAllNotesRequest {
  tagIds?: string;
}
export interface GetAllNotesResponse {
  readonly notes: GetNoteByIdResponse[];
}
export function getAllNotes(payload: GetAllNotesRequest): Promise<GetAllNotesResponse> {
  const queryParams = payload.tagIds ? `?tags=${payload.tagIds}` : "";
  return apiRequest<GetAllNotesResponse>(`/notes${queryParams}`, {
    method: "GET",
  });
}

export interface GetNoteByIdRequest {
  readonly id: string;
}
export interface GetNoteByIdResponse {
  readonly id: string;
  readonly name: string;
  readonly content: string;
  readonly parentFolderId: string;
  readonly tagIds: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
export function getNoteById(payload: GetNoteByIdRequest): Promise<GetNoteByIdResponse> {
  return apiRequest<GetNoteByIdResponse>(`/notes/${payload.id}`, {
    method: "GET",
  });
}

export interface CreateNoteRequest {
  readonly name: string;
  readonly content?: string;
  readonly parentFolderId: string;
}
export interface CreateNoteResponse {
  readonly note: GetNoteByIdResponse;
}
export function createNote(payload: CreateNoteRequest): Promise<CreateNoteResponse> {
  return apiRequest<CreateNoteResponse>("/notes", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      parent_folder_id: payload.parentFolderId,
      content: payload.content,
    }),
  });
}

export interface SearchNotesRequest {
  readonly keyword: string;
}
export interface SearchNotesResponse {
  readonly notes: GetNoteByIdResponse[];
}
export function searchNotes(payload: SearchNotesRequest): Promise<SearchNotesResponse> {
  return apiRequest<SearchNotesResponse>(`/notes/search?q=${payload.keyword}`, {
    method: "GET",
  });
}

export interface UpdateNoteRequest {
  readonly id: string;
  readonly newName?: string;
  readonly newContent?: string;
  readonly newParentFolderId?: string;
}
export interface UpdateNoteResponse {
  readonly note: GetNoteByIdResponse;
}
export function updateNote(payload: UpdateNoteRequest): Promise<UpdateNoteResponse> {
  return apiRequest<UpdateNoteResponse>(`/notes/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.newName,
      content: payload.newContent,
      parent_folder_id: payload.newParentFolderId,
    }),
  });
}

export interface DeleteNoteRequest {
  readonly id: string;
}
export function deleteNote(payload: DeleteNoteRequest): Promise<void> {
  return apiRequest<void>(`/notes/${payload.id}`, {
    method: "DELETE",
  });
}

export async function getNotePath(noteId: string): Promise<string> {
  const { name, parentFolderId } = await getNoteById({ id: noteId });
  const folderPath = await getFolderPath(parentFolderId);
  return `${folderPath}/${name}`;
}
