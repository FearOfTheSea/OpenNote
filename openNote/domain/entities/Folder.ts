import { randomUUID, validateName } from "../utils.ts";

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
    folderId?: string,
  ) {
    if (!name || name.trim() === "") {
      throw new Error("Folder name cannot be empty");
    }
    if (!validateName(name)) {
      throw new Error(
        "Folder name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces",
      );
    }

    this.id = folderId || randomUUID();
    this.name = name.trim();
    this.userId = userId;
    this.parentFolderId = parentFolderId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
