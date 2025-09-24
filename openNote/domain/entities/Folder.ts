export class Folder {
    public readonly id: string;
    public readonly name: string;
    public readonly folderId?: string;

    constructor(
        name: string,
        id?: string,
        folderId?: string
    ) {
        if (!name || name.trim() === '') {
            throw new Error('Folder name cannot be empty');
        }

        this.id = id || crypto.randomUUID();
        this.name = name.trim();
        this.folderId = folderId;
    }
}