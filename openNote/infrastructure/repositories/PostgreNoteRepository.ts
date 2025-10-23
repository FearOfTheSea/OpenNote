import { Note } from "../../domain/entities/Note.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import dbClient from "../db/postgresClient.ts";
import { Tag } from "../../domain/entities/Tag.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";

/**
 * PostgreSQL implementation of NoteRepository
 */
export class PostgreNoteRepository implements NoteRepository {
  constructor(private tagRepository: TagRepository) {}

  /** Find all notes belonging to a user */
  async findAll(userId: string): Promise<Note[]> {
    const result = await dbClient.queryObject(
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
    const result = await dbClient.queryObject(
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
    const result = await dbClient.queryObject(
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
  async findByTagIds(tagIds: string[], userId: string): Promise<Note[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    const result = await dbClient.queryObject(
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
      [tagIds, userId]
    );

    return result.rows.map((row) => this.mapRowToNote(row));
  }

  /** Move note to another folder */
  async cutNote(noteId: string, newFolderId: string): Promise<void> {
    const note = await this.findById(noteId);
    if (!note) throw new Error("Note not found");

    if (note.parentFolderId === newFolderId) return;

    await dbClient.queryObject(
      `
      UPDATE notes
      SET folder_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE note_id = $2
      `,
      [newFolderId, noteId]
    );
  }

  /** Create or update note, update tags */
  async save(note: Note): Promise<void> {
    const tx = dbClient.createTransaction("save_note_tx");

    try {
      await tx.begin();

      await tx.queryObject(
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

      // del previous tags associations in note_tags table
      await tx.queryObject(`DELETE FROM note_tags WHERE note_id = $1`, [
        note.id,
      ]);

      // lưu các tag mới
      const tagNames = this.extractTags(note.content);
      for (const tagName of tagNames) {
        const tag = new Tag(tagName);
        await this.tagRepository.save(tag, note.id, tx);
      }

      await tx.commit();
    } catch (e) {
      await tx.rollback();
      console.error("Transaction failed in save note.", e);
      throw e;
    }
  }

  /** Delete note by id */
  async delete(id: string): Promise<void> {
    const tx = dbClient.createTransaction("delete_note_tx");

    try {
      await tx.begin();

      // lấy danh sách tag liên quan đến note trước khi xóa
      const tagResult = await tx.queryObject<{ tag_id: string }>(
        `SELECT nt.tag_id FROM note_tags nt WHERE nt.note_id = $1`,
        [id]
      );
      const tagsToCheck = tagResult.rows;

      // xóa note ở notes và relation in note_tags
      const deleteNoteResult = await tx.queryObject(
        `DELETE FROM notes WHERE note_id = $1`,
        [id]
      );

      if (deleteNoteResult.rowCount === 0) {
        // không có note nào bị xóa, rollback và thoát
        await tx.rollback();
        return;
      }

      // del các tag không còn được sử dụng
      for (const row of tagsToCheck) {
        await this.tagRepository.delete(row.tag_id, tx);
      }

      await tx.commit();
    } catch (e) {
      await tx.rollback();
      console.error("Transaction failed in delete note", e);
      throw e;
    }
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
      Array.isArray(row.tags) ? row.tags : [] // tagsIds
    );
  }

  /** Extract tags (#tag) from note content */
  private extractTags(content: string): string[] {
    const matches = content?.match(/#(\w+)/g);
    return matches ? matches.map((t) => t.substring(1).toLowerCase()) : [];
  }
}
