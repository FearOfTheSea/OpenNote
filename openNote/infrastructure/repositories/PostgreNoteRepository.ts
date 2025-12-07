import { Note } from "../../domain/entities/Note.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { getPool, closeDbPool } from "../db/postgresClient.ts";
import { QueryObjectResult, Transaction } from "pg";
import { buildSearchSyntax } from "../utils/SearchHelper.ts";

/**
 * PostgreSQL implementation of NoteRepository
 */
export class PostgreNoteRepository implements NoteRepository {
  constructor(private tx?: Transaction) {}

  private async executeQuery<T>(
    query: string,
    args: any[] = []
  ): Promise<QueryObjectResult<T>> {
    if (this.tx) {
      return await this.tx.queryObject<T>(query, args);
    } else {
      let client;
      try {
        const pool = await getPool();
        client = await pool.connect();

        await client.queryObject("SELECT 1");
        return await client.queryObject<T>(query, args);
      } catch (error) {
        await closeDbPool();
        throw error;
      } finally {
        if (client) {
          client.release(); // chỉ release khi đã connect thành công
        }
      }
    }
  }

  /** Find all notes belonging to a user */
  async findAll(userId: string): Promise<Note[]> {
    const result = await this.executeQuery(
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
      [userId]
    );

    return result.rows.map((row) => this.mapRowToNote(row));
  }

  /** dind note by its id */
  async findById(id: string): Promise<Note | null> {
    const result = await this.executeQuery(
      `
      SELECT n.*,
        COALESCE(ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE n.note_id = $1
      GROUP BY n.note_id
      `,
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToNote(result.rows[0]);
  }

  /** find notes by folder id */
  async findByFolderId(folderId: string): Promise<Note[]> {
    const result = await this.executeQuery(
      `
      SELECT n.*,
        COALESCE(ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL), '{}') AS tags
      FROM notes n
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE n.folder_id = $1
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
      [folderId]
    );

    return result.rows.map((row) => this.mapRowToNote(row));
  }

  /** find one user's note by list of tags id */
  async findByTagsIds(tagIds: string[], userId: string): Promise<Note[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    const query = `
  WITH matched_notes AS (
    SELECT n.note_id
    FROM notes n
    JOIN folders f ON n.folder_id = f.folder_id
    JOIN note_tags nt ON n.note_id = nt.note_id
    WHERE nt.tag_id = ANY($1)
      AND f.user_id = $2
    GROUP BY n.note_id
    HAVING COUNT(DISTINCT nt.tag_id) = $3
  )
  SELECT n.*,
    COALESCE(
      ARRAY_AGG(nt_all.tag_id) FILTER (WHERE nt_all.tag_id IS NOT NULL),
      '{}'
    ) AS tags
  FROM notes n
  JOIN matched_notes mn ON n.note_id = mn.note_id
  LEFT JOIN note_tags nt_all ON n.note_id = nt_all.note_id
  GROUP BY n.note_id
  ORDER BY n.updated_at DESC
`;

    const result = await this.executeQuery(query, [
      tagIds,
      userId,
      tagIds.length,
    ]);

    return result.rows.map((row) => this.mapRowToNote(row));
  }

  /** Move note to another folder */
  async cutNote(noteId: string, newFolderId: string): Promise<boolean> {
    const note = await this.findById(noteId);
    if (!note) throw new Error("Note not found");

    if (note.parentFolderId === newFolderId) return false;

    // kiểm tra quyền sở hữu của folder mới
    const checkOwnership = await this.executeQuery<{ user_id: string }>(
      `SELECT user_id FROM folders WHERE folder_id = $1`,
      [newFolderId]
    );

    if (checkOwnership.rows.length === 0) {
      throw new Error("Target folder not found");
    }

    const targetFolderOwnerId = checkOwnership.rows[0].user_id;

    const currentFolderOwner = await this.executeQuery<{ user_id: string }>(
      `SELECT user_id FROM folders WHERE folder_id = $1`,
      [note.parentFolderId]
    );

    const currentOwnerId = currentFolderOwner.rows[0]?.user_id;

    if (currentOwnerId !== targetFolderOwnerId) {
      throw new Error(
        "Cannot move note to a folder belonging to another user."
      );
    }

    await this.executeQuery(
      `
      UPDATE notes
      SET folder_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE note_id = $2
      `,
      [newFolderId, noteId]
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
      [note.id, note.name, note.content, note.parentFolderId]
    );
  }

  /** Delete note by id */
  async delete(id: string): Promise<void> {
    if (!this.tx) {
      throw new Error("delete method must be called within a transaction.");
    }
    await this.tx.queryObject(`DELETE FROM notes WHERE note_id = $1`, [id]);
  }

  /** Search by keyword in title or content */
  async searchByKeyword(keyword: string, userId: string): Promise<Note[]> {
    if (!keyword || !keyword.trim()) {
      return [];
    }

    const searchSyntax = buildSearchSyntax(keyword);
    if (!searchSyntax) return [];

    const likeSyntax = `%${keyword.trim()}%`;

    const query = `
      SELECT n.*,
        -- Sử dụng to_tsquery thay vì plainto_tsquery để dùng prefix search
        ts_rank_cd(n.search_vector, to_tsquery('simple', $1)) AS rank,
        COALESCE(
          ARRAY_AGG(nt.tag_id) FILTER (WHERE nt.tag_id IS NOT NULL),
          '{}'
        ) AS tags
      FROM notes n
      JOIN folders f ON n.folder_id = f.folder_id
      LEFT JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE f.user_id = $2
        AND (
          n.search_vector @@ to_tsquery('simple', $1)
          OR
          unaccent(n.title) ILIKE unaccent($3)
          OR
          unaccent(n.content) ILIKE unaccent($3)
        )
      GROUP BY n.note_id
      ORDER BY rank DESC, n.updated_at DESC
    `;

    const result = await this.executeQuery(query, [
      searchSyntax,
      userId,
      likeSyntax,
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
      row.created_at,
      row.updated_at
    );
  }
}
