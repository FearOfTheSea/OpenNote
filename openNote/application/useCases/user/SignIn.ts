import { UserRepository } from "../../repositories/UserRepository.ts";
import { PasswordHasher } from "../../ports/IPasswordHasher.ts";

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

export interface SignInOutput {
  readonly userId: string;
  readonly userEmail: string;
}

export class SignIn {
  constructor(private userRepository: UserRepository) {}

  async execute(
    input: SignInInput,
    hasher: PasswordHasher,
  ): Promise<SignInOutput> {
    const foundUser = await this.userRepository.findByEmail(input.email);
    if (!foundUser) {
      throw new Error(`There's no account with the email"${input.email}"!`);
    }

    try {
      const valid = await hasher.comparePassword(
        input.password,
        foundUser.passwordHash,
      );
      if (valid) {
        console.log(`[SignIn] User with email ${input.email} logged in!`);
        return { userEmail: foundUser.email, userId: foundUser.id };
      } else {
        throw new Error(`[SignIn] Invalid password!`);
      }
    } catch (error) {
      throw error;
    }
  }
}
