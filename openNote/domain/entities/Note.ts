export class Note {
    readonly id: string;
    readonly name: string;
    readonly content: string;
    readonly folderId: string;
    readonly tagsId: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(
        name: string,
        content: string,
        folderId: string,
        tagsId: string[] = [],
    ) {
        if (!name || name.trim() === "") {
            throw new Error("Note name cannot be empty");
        }
        if (!folderId) {
            throw new Error("Parent folder id cannot be null");
        }

        this.id = crypto.randomUUID();
        this.name = name.trim();
        this.content = content;
        this.folderId = folderId;
        this.tagsId = tagsId;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
