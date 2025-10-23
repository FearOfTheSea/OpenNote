import { randomUUID, validateName } from "../utils.ts";

export class Tag {
    public readonly id: string;
    public readonly name: string;
    public readonly noteId: string;

    constructor(name: string, noteId: string) {
        if (!name || name.trim() === "") {
            throw new Error("Tag name cannot be empty");
        }
        if (!validateName(name.trim())) {
            throw new Error("Tag name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces");
        }

        this.id = randomUUID();
        this.noteId = noteId;
        this.name = name.trim();
    }
}
