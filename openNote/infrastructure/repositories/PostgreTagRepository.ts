import { Tag } from "../../domain/entities/Tag.ts";
import { Note } from "../../domain/entities/Note.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import dbClient from "../db/postgresClient.ts";

/**
 * PostgreSQL implementation of TagRepository.
 */
export class PostgreTagRepository implements TagRepository {
    /**
     * find notes that have a specific tag name
     */
    async findByName(name: string): Promise<Note[]> {
        const formattedName = name.startsWith("#") ? name : `#${name}`;

        const result = await dbClient.queryObject(
            `
      SELECT n.note_id, n.title, n.content, n.folder_id, n.created_at, n.updated_at
      FROM notes n
      INNER JOIN note_tags nt ON n.note_id = nt.note_id
      INNER JOIN tags t ON t.tag_name = nt.tag_name
      WHERE t.tag_name = $1
      ORDER BY n.updated_at DESC
      `,
            [formattedName],
        );

        return result.rows.map(
            (row: any) =>
                new Note(
                    row.title,
                    row.content,
                    row.folder_id,
                    Array.isArray(row.tags) ? row.tags : [],
                    row.note_id,
                    row.created_at,
                    row.updated_at,
                ),
        );
    }

    /**
     * find all tags — only return tag names
     */
    async findAll(): Promise<string[] | null> {
        const result = await dbClient.queryObject<{ tag_name: string }>(
            `
      SELECT tag_name
      FROM tags
      ORDER BY tag_name ASC
      `,
        );

        return result.rows.map((row) => row.tag_name);
    }

    /**
     * save tag — insert into tags and note_tags tables
     */
    async save(tag: Tag): Promise<void> {
        const formattedName = tag.tagName.startsWith("#") ? tag.tagName : `#${tag.tagName}`;

        const client = dbClient;

        try {
            // add tag to tags table if not exist
            await client.queryObject(
                `
        INSERT INTO tags (tag_name)
        VALUES ($1)
        ON CONFLICT (tag_name) DO NOTHING
        `,
                [formattedName],
            );

            // link note with tag (if noteId exists)
            if (tag.noteId) {
                await client.queryObject(
                    `
          INSERT INTO note_tags (note_id, tag_name)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
          `,
                    [tag.noteId, formattedName],
                );
            }
        } catch (error) {
            console.error("Error saving tag:", error);
            throw error;
        }
    }

    /**
     * delete tag and its relations in note_tags
     */
    async delete(tagName: string): Promise<void> {
        const formattedName = tagName.startsWith("#") ? tagName : `#${tagName}`;

        const client = dbClient;

        try {
            // delete all relations first
            await client.queryObject(
                `
        DELETE FROM note_tags WHERE tag_name = $1
        `,
                [formattedName],
            );

            // delete tag itself
            await client.queryObject(
                `
        DELETE FROM tags WHERE tag_name = $1
        `,
                [formattedName],
            );
        } catch (error) {
            console.error("Error deleting tag:", error);
            throw error;
        }
    }
}
