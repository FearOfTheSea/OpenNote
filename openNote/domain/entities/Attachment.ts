import { randomUUID } from "crypto";

/**
 * represents a file attachment belonging to a Note.
 */
export class Attachment {
    public readonly id: string;
    public readonly noteId: string;
    public readonly path: string;
    public readonly fileName: string;
    public readonly size?: number;
    public readonly mimeType?: string;
    public readonly createdAt: Date;

    constructor(params: {
        noteId: string;
        path: string;
        fileName: string;
        size?: number;
        mimeType?: string;
    }) {
        const { noteId, path, fileName, size, mimeType } = params;

        if (!noteId) {
            throw new Error("Attachment must belong to a note (noteId is required).");
        }
        if (!path || path.trim() === "") {
            throw new Error("Attachment path cannot be empty.");
        }
        if (!fileName || fileName.trim() === "") {
            throw new Error("Attachment file name cannot be empty.");
        }
        if (size !== undefined && size < 0) {
            throw new Error("Attachment size cannot be negative.");
        }

        this.id = randomUUID();
        this.noteId = noteId;
        this.path = path;
        this.fileName = fileName;
        this.size = size;
        this.mimeType = mimeType;
        this.createdAt = new Date();
    }
}
