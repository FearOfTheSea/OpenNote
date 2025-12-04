import { UserRepository } from "../../../application/repositories/UserRepository.ts";
import {
  SignUp,
  SignUpInput,
} from "../../../application/useCases/user/SignUp.ts";
import { PasswordHasher } from "../../../application/ports/IPasswordHasher.ts";

export interface SignUpRequest {
  readonly fullname: string;
  readonly email: string;
  readonly password: string;
}

export interface SignUpResponse {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
}

export class SignUpController {
  private useCase: SignUp;

  constructor(userRepository: UserRepository) {
    this.useCase = new SignUp(userRepository);
  }

  async apply(
    request: SignUpRequest,
    passwordHasher: PasswordHasher
  ): Promise<SignUpResponse> {
    const input = request as SignUpInput;
    try {
      return (await this.useCase.execute(input, passwordHasher))
        .user as SignUpResponse;
    } catch (error) {
      throw error;
    }
  }
}
