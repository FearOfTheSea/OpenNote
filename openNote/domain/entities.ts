    export interface Tag {
        id: string;
        name: string;
    }

    export interface Folder {
        id: string;
        name: string;
        folderId?: string;
    }

    export interface Note {
        id: string;
        name: string;
        content: string;
        folderId?: string;
        tagsId: string[];
    }