export class Tag {
    public readonly id: string;
    public readonly name: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(name: string) {
        if (!name || name.trim() === "") {
            throw new Error("Tag name cannot be empty");
        }

        this.id = crypto.randomUUID();
        this.name = name.trim();
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
