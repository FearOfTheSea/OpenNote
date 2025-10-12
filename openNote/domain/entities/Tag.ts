export class Tag {
    public readonly id: string;
    public readonly name: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    constructor(
        name: string,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        if (!name || name.trim() === '') {
            throw new Error('Tag name cannot be empty');
        }

        this.id = id || crypto.randomUUID();
        this.name = name.trim();
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }
}