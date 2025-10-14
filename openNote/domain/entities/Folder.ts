export class Folder {
    public readonly id: string;
    public readonly name: string;
    public readonly parentFolderId?: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(
        name: string,
        id?: string, // Null id means root folder
        parentFolderId?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        if (!name || name.trim() === "") {
            throw new Error("Folder name cannot be empty");
        }

        this.id = id || crypto.randomUUID();
        this.name = name.trim();
        this.parentFolderId = parentFolderId;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }
}
