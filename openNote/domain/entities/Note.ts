import { randomUUID, validateName } from "../utils.ts";

export class Note {
  readonly id: string;
  readonly name: string;
  readonly content: string;
  readonly parentFolderId: string;
  readonly tagIds: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    name: string,
    content: string,
    parentFolderId: string,
    tagIds?: string[],
    id?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    if (!name || name.trim() === "") {
      throw new Error("Note name cannot be empty");
    }
    if (!validateName(name)) {
      throw new Error(
        "Note name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces"
      );
    }
    if (!parentFolderId) {
      throw new Error("Parent folder id cannot be null");
    }

    this.id = id || randomUUID();
    this.name = name.trim();
    this.content = content;
    this.parentFolderId = parentFolderId;
    this.tagIds = tagIds || [];
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
