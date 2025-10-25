import { Tag } from "../../domain/entities/Tag.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import dbClient from "../db/postgresClient.ts";
import { Transaction } from "pg";

/**
 * PostgreSQL implementation of TagRepository.
 */
export class PostgreTagRepository implements TagRepository {
    constructor(private tx?: Transaction) {}

    private getQueryRunner() {
        if (this.tx) {
            return this.tx;
        }
        return dbClient;
    }

    /**
     * find all tags of a user - return tag names
     */
    async findAll(userId: string): Promise<Tag[]> {
        const result = await this.getQueryRunner().queryObject<{
            tag_name: string;
            tag_id: string;
        }>(
            `
      SELECT DISTINCT t.tag_name, t.tag_id
      FROM tags t
      JOIN note_tags nt ON t.tag_name = nt.tag_name
      JOIN notes n ON nt.note_id = n.note_id
      JOIN folders f ON n.folder_id = f.folder_id
      WHERE f.user_id = $1
      ORDER BY t.tag_name ASC
      `,
            [userId],
        );

        return result.rows.map((row) => new Tag(row.tag_name, row.tag_id));
    }

    /*
     * remove old tags and add new tags for a note
     * clean up orphan tags (tags not linked to any note)
     */
    async syncTagsForNoteUpdate(
        noteId: string,
        noteContent: string,
    ): Promise<void> {
        if (!this.tx) {
            throw new Error(
                "Transaction is required for syncTagsForNoteUpdate operation",
            );
        }

        const oldTagsResult = await this.tx.queryObject<{ tag_id: string }>(
            `SELECT tag_id FROM note_tags WHERE note_id = $1`,
            [noteId],
        );
        const oldTagIds = oldTagsResult.rows.map((row) => row.tag_id);

        // delete all existing tag relations for the note
        await this.tx.queryObject(`DELETE FROM note_tags WHERE note_id = $1`, [
            noteId,
        ]);

        const tagNames = this.extractTags(noteContent);

        // add new tag relations
        for (const name of tagNames) {
            const tag = new Tag(name);
            await this.save(tag, noteId);
        }

        // clean up orphan tags
        for (const tagId of oldTagIds) {
            await this.deleteOrphanedTag(tagId);
        }
    }

    /**
     * save tag — insert into tags and note_tags tables for new tag
     * insert to note_tags only if tag already exists in tags table
     */
    // before pass Tag entity, need to ensure tag name formated correctly: #tag
    // use extractTags util function
    async save(tag: Tag, noteId: string): Promise<void> {
        if (!this.tx) {
            throw new Error("save method must be called within a transaction.");
        }
        const cleanName = tag.name.replace(/^#/, "").toLowerCase();
        //use transaction to ensure both inserts succeed or fail together

        // insert into tags table if not exists, new tag (global)
        await this.tx.queryObject(
            `
        INSERT INTO tags (tag_id, tag_name)
        VALUES ($1, $2)
        ON CONFLICT (LOWER(tag_name)) DO NOTHING
        `,
            [tag.id, cleanName],
        );

        // link tag with note in note_tags table
        await this.tx.queryObject(
            `
        INSERT INTO note_tags (note_id, tag_id)
        SELECT $1, t.tag_id
        FROM tags t
        WHERE LOWER(t.tag_name) = $2
        ON CONFLICT DO NOTHING
        `,
            [noteId, cleanName],
        );
    }

    /**
     * delete tag if not used by any note
     */
    async deleteOrphanedTag(tagId: string): Promise<void> {
        if (!this.tx) {
            throw new Error(
                "deleteOrphanedTag method must be called within a transaction.",
            );
        }

        if (tagId === null) return;
        // auto remove relation in note_tags by on delete cascade

        // check tag global usage, neu co thi giu o tags
        const tagUsage = await this.tx.queryObject<{ count: number }>(
            `
          SELECT COUNT(*)::int AS count
          FROM note_tags
          WHERE tag_id = $1
          `,
            [tagId],
        );

        if (tagUsage.rows[0].count === 0) {
            await this.tx.queryObject(`DELETE FROM tags WHERE tag_id = $1`, [tagId]);
        }
    }

    /**
     * delete all tags that are no longer linked to any note
     */
    async cleanupOrphanTags(): Promise<void> {
        if (!this.tx) {
            throw new Error(
                "cleanupOrphanTags method must be called within a transaction.",
            );
        }

        await this.tx.queryObject(`
    DELETE FROM tags
    WHERE tag_id NOT IN (
      SELECT DISTINCT tag_id FROM note_tags
    )
  `);
    }

    /** Extract tags (#tag) from note content */
    private extractTags(content: string): string[] {
        const matches = content?.match(/#(\w+)/g);
        return matches ? matches.map((t) => t.substring(1).toLowerCase()) : [];
    }
}
