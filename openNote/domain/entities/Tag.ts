export class Tag {
    public readonly id: string;
    public readonly name: string;

    constructor(
        name: string,
        id?: string
    ) {
        if (!name || name.trim() === '') {
            throw new Error('Tag name cannot be empty');
        }

        this.id = id || crypto.randomUUID();
        this.name = name.trim();
    }
}