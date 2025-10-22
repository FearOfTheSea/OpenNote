import { randomUUID, validateName } from "../utils.ts";

export class Tag {
    public readonly tagName: string;
    public readonly noteId: string;

    constructor(tagName: string, noteId: string) {
        if (!tagName || tagName.trim() === "") {
            throw new Error("Tag name cannot be empty");
        }

        this.noteId = noteId;
        this.tagName = tagName.trim();
    }
}
