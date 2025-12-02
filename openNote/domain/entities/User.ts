import { randomUUID } from "../utils.ts";

export class User {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;

  constructor(params: {
    fullName: string;
    email: string;
    passwordHash: string;
    userId?: string;
  }) {
    const { fullName, email, passwordHash, userId } = params;

    if (!fullName || fullName.trim() === "") {
      throw new Error("User full name cannot be empty.");
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Invalid email format.");
    }
    if (!passwordHash) {
      throw new Error("Password hash cannot be empty.");
    }

    this.id = userId || randomUUID();
    this.fullName = fullName.trim();
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = new Date();
  }
}
