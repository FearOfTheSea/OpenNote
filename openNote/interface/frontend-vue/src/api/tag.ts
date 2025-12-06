import { apiRequest } from "./http";

export interface TagViewObject {
  readonly id: string;
  readonly name: string;
}
export function getAllTags(): Promise<TagViewObject[]> {
  return apiRequest<TagViewObject[]>(`/tags`, {
    method: "GET",
  });
}
