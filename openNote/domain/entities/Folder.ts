export class Folder {
  public readonly id: string;
  public readonly name: string;
  public readonly userId: string;
  public readonly parentFolderId?: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

    constructor(
        name: string,
        parentFolderId?: string,
        isRootFolder: boolean,
        userId: string,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        if (!name || name.trim() === "") {
            throw new Error("Folder name cannot be empty");
        }
        if (isRootFolder) {
            this.id = "root";
            this.parentFolderId = undefined;
        } else {
            this.id = id || crypto.randomUUID();
            this.parentFolderId = parentFolderId;
        }
        this.name = name.trim();
        this.userId = userId;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }
}
