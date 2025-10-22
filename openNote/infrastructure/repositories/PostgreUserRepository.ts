import { UserRepository } from "../../application/repositories/UserRepository.ts";
import { User } from "../../domain/entities/User.ts";
import dbClient from "../db/postgresClient.ts";

export class PostgreUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const result = await dbClient.queryObject(
            `
      SELECT user_id, full_name, email, password_hash, created_at
      FROM users
      WHERE email = $1
      `,
            [email],
        );
        if (result.rows.length === 0) {
            return null;
        }

        const row: any = result.rows[0];
        return new User({
            fullName: row.full_name,
            email: row.email,
            passwordHash: row.password_hash,
            id: row.user_id,
            createdAt: row.created_at,
        });
    }

    async save(user: User): Promise<void> {
        await dbClient.queryObject(
            `
      INSERT INTO users (user_id, full_name, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5)       
        ON CONFLICT (email) DO NOTHING
        `,
            [user.id, user.fullName, user.email, user.passwordHash, user.createdAt],
        );
    }
}
