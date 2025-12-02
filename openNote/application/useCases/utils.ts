export interface PasswordHasher {
  createHash(password: string): Promise<string>;
  comparePassword(suppliedPassword: string, hash: string): Promise<boolean>;
}
