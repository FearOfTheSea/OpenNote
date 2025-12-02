import { UserRepository } from "../../repositories/UserRepository.ts";
import { PasswordHasher } from "../utils.ts";

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

export class SignIn {
  constructor(private userRepository: UserRepository) {}

  async execute(input: SignInInput, hasher: PasswordHasher): Promise<void> {
    const foundUser = await this.userRepository.findByEmail(input.email);
    if (!foundUser) {
      throw new Error(`There's no account with the email"${input.email}"!`);
    }

    try {
      const valid = await hasher.comparePassword(input.password, foundUser.passwordHash);
      if (valid) {
        console.log(`[SignIn] User with email ${input.email} logged in!`);
      } else {
        throw new Error(`[SignIn] Invalid password!`);
      }
    } catch (error) {
      throw error;
    }
  }
}
