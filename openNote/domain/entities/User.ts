import { randomUUID } from "../utils.ts";

export class User {
    public readonly id: string;
    public readonly fullName: string;
    public readonly email: string;
    public readonly passwordHash: string;
    public readonly createdAt: Date;

    constructor(params: {
        fullName: string;
        email: string;
        passwordHash: string;
        id?: string;
        createdAt?: Date;
    }) {
        const { fullName, email, passwordHash, id, createdAt } = params;

        // Validation
        if (!fullName || fullName.trim() === "") {
            throw new Error("User full name cannot be empty.");
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            throw new Error("Invalid email format.");
        }
        if (!passwordHash) {
            throw new Error("Password hash cannot be empty.");
        }

        this.id = id || randomUUID();
        this.fullName = fullName.trim();
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt || new Date();
    }
}
