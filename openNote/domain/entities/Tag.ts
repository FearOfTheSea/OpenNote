import { randomUUID, validateName } from "../utils.ts";

export class Tag {
    public readonly id: string;
    public readonly name: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(
        name: string,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        if (!name || name.trim() === "") {
            throw new Error("Tag name cannot be empty");
        }
        if (!validateName(name)) {
            throw new Error("Tag name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces");
        }
        this.id = id || randomUUID();
        this.name = name.trim();
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }
}