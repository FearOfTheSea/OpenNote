import { apiRequest } from "./http";
import type { GetNoteByIdResponse } from "./note";

export interface GetAllFoldersResponse {
  readonly folders: GetFolderByIdResponse[];
}
export function getAllFolders(): Promise<GetAllFoldersResponse> {
  return apiRequest<GetAllFoldersResponse>("/folders/", {
    method: "GET",
  });
}

export interface GetFolderByIdRequest {
  readonly id: string;
}
export interface GetFolderByIdResponse {
  readonly id: string;
  readonly name: string;
  readonly userId: string;
  readonly parentFolderId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
export function getFolderById(payload: GetFolderByIdRequest): Promise<GetFolderByIdResponse> {
  return apiRequest<GetFolderByIdResponse>(`/folders/${payload.id}`, {
    method: "GET",
  });
}

export interface CreateFolderRequest {
  readonly name: string;
  readonly parentFolderId?: string;
}
export interface CreateFolderResponse {
  readonly id: string;
  readonly name: string;
  readonly userId: string;
  readonly parentFolderId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
export function createFolder(payload: CreateFolderRequest): Promise<CreateFolderResponse> {
  return apiRequest<CreateFolderResponse>("/folders", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      parent_folder_id: payload.parentFolderId,
    }),
  });
}

export interface SearchFoldersRequest {
  readonly keyword: string;
}
export interface SearchFoldersResponse {
  readonly folders: GetFolderByIdResponse[];
}
export function searchFolders(payload: SearchFoldersRequest): Promise<SearchFoldersResponse> {
  return apiRequest<SearchFoldersResponse>(`/folders/search?q=${payload.keyword}`, {
    method: "GET",
  });
}

export interface GetFolderContentsRequest {
  readonly folderId: string;
}
export interface GetFolderContentsResponse {
  readonly folders: GetFolderByIdResponse[];
  readonly notes: GetNoteByIdResponse[];
}
export function getFolderContents(payload: GetFolderContentsRequest): Promise<GetFolderContentsResponse> {
  return apiRequest<GetFolderContentsResponse>(`/folders/${payload.folderId}/contents`, {
    method: "GET",
  });
}

export interface UpdateFolderRequest {
  readonly id: string;
  readonly newName?: string;
  readonly newParentFolderId?: string;
}
export interface UpdateFolderResponse {
  readonly folder: GetFolderByIdResponse;
}
export function updateFolder(payload: UpdateFolderRequest): Promise<UpdateFolderResponse> {
  return apiRequest<UpdateFolderResponse>(`/folders/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.newName,
      parent_folder_id: payload.newParentFolderId,
    }),
  });
}

export interface DeleteFolderRequest {
  id: string;
}
export function deleteFolder(payload: DeleteFolderRequest): Promise<void> {
  return apiRequest<void>(`/folders/${payload.id}`, {
    method: "DELETE",
  });
}

export async function getFolderPath(folderId: string): Promise<string> {
  const folderInfo = await getFolderById({ id: folderId });
  if (!folderInfo.parentFolderId) {
    return `/root/${folderInfo.name}`;
  } else {
    const parentPath = await getFolderPath(folderInfo.parentFolderId);
    return `${parentPath}/${folderInfo.name}`;
  }
}
