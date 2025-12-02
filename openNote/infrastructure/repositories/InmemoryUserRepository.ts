import { UserRepository } from "../../application/repositories/UserRepository.ts";
import { User } from "../../domain/entities/User.ts";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  findByEmail(email: string): Promise<User | null> {
    const found = this.users.find((u) => u.email === email);
    return Promise.resolve(found ? found : null);
  }
  save(user: User): Promise<void> {
    this.users.push(user);
    return Promise.resolve();
  }
}
