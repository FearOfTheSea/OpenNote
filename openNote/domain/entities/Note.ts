export class Note {
  public readonly id: string;
  public readonly name: string;
  public readonly content: string;
  public readonly folderId?: string;
  public readonly tagsId: string[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    name: string,
    content: string,
    folderId?: string,
    tagsId: string[] = [],
    id?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    if (!name || name.trim() === "") {
      throw new Error("Note name cannot be empty");
    }

    this.id = id || crypto.randomUUID();
    this.name = name.trim();
    this.content = content;
    this.folderId = folderId;
    this.tagsId = tagsId;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
