import { UploadedInputFile } from "../../application/services/IStorageService.ts";
import { randomUUID, validateName } from "../utils.ts";
import { Attachment } from "./Attachment.ts";

export class Note {
    readonly id: string;
    readonly name: string;
    readonly content: string;
    readonly folderId: string;
    readonly tagsId?: string[];
    readonly attachments?: (Attachment | UploadedInputFile)[];
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(
        name: string,
        content: string,
        folderId: string,
        tagsId?: string[],
        attachments?: (Attachment | UploadedInputFile)[],
    ) {
        if (!name || name.trim() === "") {
            throw new Error("Note name cannot be empty");
        }
        if (!validateName(name)) {
            throw new Error(
                "Note name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces",
            );
        }
        if (!folderId) {
            throw new Error("Parent folder id cannot be null");
        }

        this.id = randomUUID();
        this.name = name.trim();
        this.content = content;
        this.folderId = folderId;
        this.tagsId = tagsId;
        this.attachments = attachments;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
