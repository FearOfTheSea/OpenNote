import bcrypt from "bcrypt";
import { PasswordHasher } from "../../application/ports/IPasswordHasher.ts";

export class BcryptPasswordHasher implements PasswordHasher {
  private saltRounds: number = 10;

  async createHash(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    return hashedPassword;
  }

  async comparePassword(
    suppliedPassword: string,
    hash: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(suppliedPassword, hash);
    return isMatch;
  }
}
