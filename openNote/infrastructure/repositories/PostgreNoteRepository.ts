import { Note } from "../../domain/entities/Note.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import dbClient from "../db/postgresClient.ts";

/**
 * PostgreSQL implementation of NoteRepository.
 */
export class PostgreNoteRepository implements NoteRepository {
    /**
     * find note by its id
     */
    async findById(id: string): Promise<Note | null> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE n.note_id = $1
      GROUP BY n.note_id
      `,
            [id],
        );

        if (result.rows.length === 0) return null;
        return this.mapRowToNote(result.rows[0]);
    }

    /**
     * find note by name
     */
    async findByName(name: string): Promise<Note[]> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE LOWER(n.title) LIKE LOWER('%' || $1 || '%')
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [name],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /**
     * function nay dung vao viec gi z
     */
    async findAll(): Promise<Note[]> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /**
     * search by folder_id
     */
    async findByFolderId(folderId: string): Promise<Note[]> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE n.folder_id = $1
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [folderId],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /**
     * find note by tag
     */
    async findByTag(tag: string): Promise<Note[]> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      INNER JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE nt.tag_name = $1
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [tag],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /**
     * create or update note
     * update tags if change
     */
    async save(note: Note): Promise<void> {
        // Upsert note
        await dbClient.queryObject(
            `
      INSERT INTO notes (note_id, title, content, folder_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (note_id) DO UPDATE
      SET title = EXCLUDED.title,
          content = EXCLUDED.content,
          folder_id = EXCLUDED.folder_id,
          -- updated_at = CURRENT_TIMESTAMP
      `,
            [note.id, note.name, note.content, note.folderId],
        );

        const tags = this.extractTags(note.content);

        // delete previous tag
        await dbClient.queryObject(`DELETE FROM note_tags WHERE note_id = $1`, [
            note.id,
        ]);

        // add new tag
        for (const tag of tags) {
            await dbClient.queryObject(
                `
        INSERT INTO tags (tag_name)
        VALUES ($1)
        ON CONFLICT (tag_name) DO NOTHING
        `,
                [tag],
            );

            await dbClient.queryObject(
                `
        INSERT INTO note_tags (note_id, tag_name)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
                [note.id, tag],
            );
        }
    }

    /**
     * delete by note_id
     */
    async delete(id: string): Promise<void> {
        await dbClient.queryObject(`DELETE FROM notes WHERE note_id = $1`, [id]);
    }

    /**
     * find note by keyword in name and content
     */
    async searchByKeyword(keyword: string): Promise<Note[]> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE LOWER(n.title) LIKE LOWER('%' || $1 || '%')
         OR LOWER(n.content) LIKE LOWER('%' || $1 || '%')
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [keyword],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /**
     * Ánh xạ kết quả SQL sang entity Note
     */
    private mapRowToNote(row: any): Note {
        return new Note(
            row.title,
            row.content,
            row.folder_id,
            Array.isArray(row.tags) ? row.tags : [],
            row.note_id,
            row.created_at,
            row.updated_at,
        );
    }

    /**
     * extract tag (#tag) from note
     */
    private extractTags(content: string): string[] {
        const matches = content?.match(/#(\w+)/g);
        return matches ? matches.map((t) => t.substring(1).toLowerCase()) : [];
    }
}
