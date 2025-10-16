export class Folder {
    public readonly id: string;
    public readonly name: string;
    public readonly userId: string;
    public readonly parentFolderId?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(
        name: string,
        userId: string,
        parentFolderId?: string,
    ) {
        if (!name || name.trim() === "") {
            throw new Error("Folder name cannot be empty");
        }

        this.id = crypto.randomUUID();
        this.name = name.trim();
        this.userId = userId;
        this.parentFolderId = parentFolderId;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
