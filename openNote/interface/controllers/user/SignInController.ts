import { UserRepository } from "../../../application/repositories/UserRepository.ts";
import { SignIn, SignInInput } from "../../../application/useCases/user/SignIn.ts";
import { PasswordHasher } from "../../../application/useCases/utils.ts";

export interface SignInRequest {
  readonly email: string;
  readonly password: string;
}

export interface SignInResponse {
  readonly userId: string;
  readonly userEmail: string;
}

export class SignInController {
  private useCase: SignIn;

  constructor(userRepository: UserRepository) {
    this.useCase = new SignIn(userRepository);
  }

  async apply(request: SignInRequest, passwordHasher: PasswordHasher): Promise<SignInResponse> {
    const input = request as SignInInput;
    try {
      return await this.useCase.execute(input, passwordHasher);
    } catch (error) {
      throw error;
    }
  }
}
