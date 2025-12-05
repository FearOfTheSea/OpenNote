import { User } from "../../../domain/entities/User.ts";
import { UserRepository } from "../../repositories/UserRepository.ts";
import { PasswordHasher } from "../../ports/IPasswordHasher.ts";

export interface SignUpInput {
  readonly fullname: string;
  readonly email: string;
  readonly password: string;
}

export interface SignUpOutput {
  readonly user: User;
}

export class SignUp {
  constructor(private userRepository: UserRepository) {}

  async execute(
    input: SignUpInput,
    hasher: PasswordHasher,
  ): Promise<SignUpOutput> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new Error(`There's already a user with email "${input.email}"!`);
    }

    try {
      const passwordHash = await hasher.createHash(input.password);
      const user = new User({
        fullName: input.fullname,
        email: input.email,
        passwordHash: passwordHash,
      });
      await this.userRepository.save(user);
      console.log(`[SignUp] Created user with name = "${user.fullName}"`);

      return { user: user };
    } catch (error) {
      throw error;
    }
  }
}
