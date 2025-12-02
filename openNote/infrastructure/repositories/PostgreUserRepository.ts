import { UserRepository } from "../../application/repositories/UserRepository.ts";
import { User } from "../../domain/entities/User.ts";
import pool from "../db/postgresClient.ts";

export class PostgreUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.queryObject(
        `
        SELECT user_id, full_name, email, password_hash, created_at
        FROM users
        WHERE email = $1
        `,
        [email]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0] as any;

      return new User({
        userId: row.user_id,
        fullName: row.full_name,
        email: row.email,
        passwordHash: row.password_hash,
      });
    } finally {
      client.release();
    }
  }

  async save(user: User): Promise<void> {
    const client = await pool.connect();
    try {
      await client.queryObject(
        `
        INSERT INTO users (user_id, full_name, email, password_hash, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        `,
        [
          user.id,
          user.fullName,
          user.email,
          user.passwordHash,
          user.createdAt ?? new Date(),
        ]
      );
    } finally {
      client.release();
    }
  }
}
