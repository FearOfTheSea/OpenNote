import { randomUUID, validateName } from "../utils.ts";

export class Tag {
  readonly id: string;
  readonly name: string;

  constructor(name: string, id?: string) {
    if (!name || name.trim() === "") {
      throw new Error("Tag name cannot be empty");
    }
    if (!validateName(name.trim())) {
      throw new Error(
        "Tag name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces",
      );
    }

    this.id = id || randomUUID();
    this.name = name.trim();
  }
}
