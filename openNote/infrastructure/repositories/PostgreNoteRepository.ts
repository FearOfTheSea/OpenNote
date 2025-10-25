import { Note } from "../../domain/entities/Note.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import dbClient from "../db/postgresClient.ts";
import { Transaction } from "pg";

/**
 * PostgreSQL implementation of NoteRepository
 */
export class PostgreNoteRepository implements NoteRepository {
    constructor(private tx?: Transaction) {}

    // helper for getting the correct query runner
    private getQueryRunner() {
        if (this.tx) {
            return this.tx;
        }
        return dbClient;
    }
    /** Find all notes belonging to a user */
    async findAll(userId: string): Promise<Note[]> {
        const result = await this.getQueryRunner().queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL), '{}') AS tags
      FROM notes n
      JOIN folders f ON n.folder_id = f.folder_id
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE f.user_id = $1
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [userId],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /** dind note by its id */
    async findById(id: string): Promise<Note | null> {
        const result = await this.getQueryRunner().queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL), '{}') AS tags
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

    /** find notes by folder id */
    async findByFolderId(folderId: string): Promise<Note[]> {
        const result = await this.getQueryRunner().queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL), '{}') AS tags
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

    /** find one user's note by list of tags id */
    async findByTagsIds(tagIds: string[], userId: string): Promise<Note[]> {
        if (!tagIds || tagIds.length === 0) {
            return [];
        }

        const result = await this.getQueryRunner().queryObject(
            `
      SELECT n.*,
        COALESCE(ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL), '{}') AS tags
      FROM notes n
      JOIN folders f ON n.folder_id = f.folder_id
      JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE nt.tag_id = any($1)
        AND f.user_id = $2
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [tagIds, userId],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /** Move note to another folder */
    async cutNote(noteId: string, newFolderId: string): Promise<boolean> {
        const note = await this.findById(noteId);
        if (!note) throw new Error("Note not found");

        if (note.parentFolderId === newFolderId) return false;

        await this.getQueryRunner().queryObject(
            `
      UPDATE notes
      SET folder_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE note_id = $2
      `,
            [newFolderId, noteId],
        );
        return true;
    }

    /** Create or update note, update tags */
    async save(note: Note): Promise<void> {
        if (!this.tx) {
            throw new Error("save method must be called within a transaction.");
        }
        await this.tx.queryObject(
            `
        INSERT INTO notes (note_id, title, content, folder_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (note_id) DO UPDATE
        SET title = EXCLUDED.title,
            content = EXCLUDED.content,
            folder_id = EXCLUDED.folder_id,
            updated_at = CURRENT_TIMESTAMP
        `,
            [note.id, note.name, note.content, note.parentFolderId],
        );
    }

    /** Delete note by id */
    //

    async delete(id: string): Promise<void> {
        if (!this.tx) {
            throw new Error("delete method must be called within a transaction.");
        }
        await this.tx.queryObject(`DELETE FROM notes WHERE note_id = $1`, [id]);
    }

    /** Search by keyword in title or content */
    async searchByKeyword(keyword: string, userId: string): Promise<Note[]> {
        const normalizedKeyword = keyword.trim().toLowerCase();
        if (!normalizedKeyword) return [];

        const query = `
      SELECT n.*, 
        COALESCE(
          ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL),
          '{}'
        ) AS tags
      FROM notes n
      JOIN folders f ON n.folder_id = f.folder_id
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE f.user_id = $2
        AND (
          LOWER(n.title) LIKE '%' || $1 || '%'
          OR LOWER(n.content) LIKE '%' || $1 || '%'
        )
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
    `;

        const result = await dbClient.queryObject(query, [
            normalizedKeyword,
            userId,
        ]);
        return result.rows.map((row) => this.mapRowToNote(row));
    }

    /** Map SQL result row to Note entity */
    private mapRowToNote(row: any): Note {
        return new Note(
            row.title,
            row.content,
            row.folder_id,
            row.tags,
            row.note_id,
        );
    }
}
