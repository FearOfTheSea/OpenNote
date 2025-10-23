import { Tag } from "../../domain/entities/Tag.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import dbClient from "../db/postgresClient.ts";
import { Transaction } from "pg";

/**
 * PostgreSQL implementation of TagRepository.
 */
export class PostgreTagRepository implements TagRepository {
  /**
   * find all tags of a user - return tag names
   */
  async findAll(userId: string): Promise<Tag[] | null> {
    const result = await dbClient.queryObject<{ tag_name: string }>(
      `
      SELECT DISTINCT t.tag_name
      FROM tags t
      JOIN note_tags nt ON t.tag_name = nt.tag_name
      JOIN notes n ON nt.note_id = n.note_id
      JOIN folders f ON n.folder_id = f.folder_id
      WHERE f.user_id = $1
      ORDER BY t.tag_name ASC
      `,
      [userId]
    );

    return result.rows.map((row) => new Tag(row.tag_name));
  }

  /**
   * find tag by its id
   */
  async findById(tagId: string): Promise<Tag | null> {
    const result = await dbClient.queryObject<{
      tag_id: string;
      tag_name: string;
    }>(
      `
      SELECT tag_id, tag_name
      FROM tags
      WHERE tag_id = $1
      LIMIT 1
      `,
      [tagId]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return new Tag(row.tag_name);
  }

  /**
   * save tag — insert into tags and note_tags tables for new tag
   * insert to note_tags only if tag already exists in tags table
   */
  async save(tag: Tag, noteId: string, tx: Transaction): Promise<void> {
    const cleanName = tag.name.replace(/^#/, "").toLowerCase();
    //use transaction to ensure both inserts succeed or fail together
    try {
      await tx.begin();

      // insert into tags table if not exists, new tag (global)
      await tx.queryObject(
        `
        INSERT INTO tags (tag_id, tag_name)
        VALUES ($1, $2)
        ON CONFLICT (LOWER(tag_name)) DO NOTHING
        `,
        [tag.id, cleanName]
      );

      // link tag with note in note_tags table
      await tx.queryObject(
        `
        INSERT INTO note_tags (note_id, tag_id)
        SELECT $1, t.tag_id
        FROM tags t
        WHERE LOWER(t.tag_name) = $2
        ON CONFLICT DO NOTHING
        `,
        [noteId, cleanName]
      );

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      console.error("Error saving tag:", error);
      throw error;
    }
  }

  /**
   * delete tag and its relations in note_tags
   */
  async delete(tagId: string, tx: Transaction): Promise<void> {
    try {
      await tx.begin();

      // auto remove relation in note_tags by on delete cascade

      // check tag usage in other notes of the same user and global usage
      const tagUsage = await tx.queryObject<{ count: number }>(
        `
          SELECT COUNT(*)::int AS count
          FROM note_tags
          WHERE tag_id = $1
          `,
        [tagId]
      );

      if (tagUsage.rows[0].count === 0) {
        await tx.queryObject(`DELETE FROM tags WHERE tag_id = $1`, [tagId]);
      }

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      console.error("Error deleting tag:", error);
      throw error;
    }
  }
}
