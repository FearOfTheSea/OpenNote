export interface Note {
    id: string;
    name: string;
    content: string;
    folderId?: string;
    tagsId: string[];
}