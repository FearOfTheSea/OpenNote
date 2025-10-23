import { Note } from "../../domain/entities/Note.ts";
import { Attachment } from "../../domain/entities/Attachment.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { AttachmentService } from "../../application/services/AttachmentService.ts";
import { UploadedInputFile } from "../../application/services/IStorageService.ts";
import dbClient from "../db/postgresClient.ts";

/**
 * PostgreSQL implementation of NoteRepository.
 */
export class PostgreNoteRepository implements NoteRepository {
    constructor(private attachmentService?: AttachmentService) {}
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
     * find one user's note by tag name
     */
    async findByTag(tag: string, userId: string): Promise<Note[]> {
        const result = await dbClient.queryObject(
            `
      SELECT n.*, 
        COALESCE(ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL), '{}') AS tags
      FROM notes n
      JOIN folders f ON n.folder_id = f.folder_id
      INNER JOIN note_tags nt ON n.note_id = nt.note_id
      WHERE nt.tag_name = $1
        AND f.user_id = $2
      GROUP BY n.note_id
      ORDER BY n.updated_at DESC
      `,
            [tag, userId],
        );

        return result.rows.map((row) => this.mapRowToNote(row));
    }

    // copy note to target folder, it means when edit or upload attachments in new copy note
    // original note wont be affected
    async copyNote(noteId: string, targetFolderId: string): Promise<Note> {
        const note = await this.findById(noteId);
        if (!note) {
            throw new Error("Note not found");
        }

        const newNoteId = crypto.randomUUID();

        // copy attachments if any
        let newAttachments: Attachment[] | undefined = undefined;

        if (this.attachmentService && note.attachments) {
            const attachments = await this.attachmentService.listAttachments(note.id);
            //const newAttachments: Attachment[] = [];
            newAttachments = [];
            for (const attachment of attachments) {
                const fileData = await this.attachmentService.copyAttachment(attachment);
                newAttachments.push(fileData);
            }
        }
        const copiedNote = new Note(
            note.name,
            note.content,
            targetFolderId ?? note.folderId,
            note.tagsId,
            newAttachments,
            newNoteId,
            new Date(),
            new Date(),
        );

        await this.save(copiedNote);
        return copiedNote;
    }

    async cutNote(noteId: string, newFolderId: string): Promise<void> {
        const note = await this.findById(noteId);
        if (!note) throw new Error("Note not found");

        if (note.folderId === newFolderId) return;

        // update folder_id of the note and updated_at
        await dbClient.queryObject(
            `
      UPDATE notes
      SET folder_id = $1,
          updated_at = CURRENT_TIMESTAMPparentFolderId
      WHERE note_id = $2
      `,
            [newFolderId, noteId],
        );
    }

    /**
     * create or update note
     * update tags if change
     * save attachments if any
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

            // if note has attachments, check new file and upload,
            // delete files that are not in note.attachments array any more
            if (this.attachmentService && note.attachments) {
                const oldAttachments = await this.attachmentService.listAttachments(
                    note.id,
                );

                // fileName của note hiện tại sau khi chỉnh sửa
                const newFileNames = new Set<string>();
                for (const attachment of note.attachments) {
                    if (this.isUploadedInputFile(attachment)) {
                        await this.attachmentService.uploadAttachment(note.id, attachment);
                        newFileNames.add(attachment.originalname);
                    } else {
                        newFileNames.add(attachment.fileName);
                    }
                }
                // Xoá các file không còn trong note.attachments
                for (const oldAttachment of oldAttachments) {
                    if (!newFileNames.has(oldAttachment.fileName)) {
                        await this.attachmentService.deleteAttachment(
                            note.id,
                            oldAttachment.fileName,
                        );
                    }
                }
            }
        }
    }

    /**
     * delete by note_id
     */
    async delete(id: string): Promise<void> {
        if (this.attachmentService) {
            await this.attachmentService.deleteAllAttachments(id);
        }

        await dbClient.queryObject(`DELETE FROM notes WHERE note_id = $1`, [id]);
    }

    /**
     * find note by keyword in name and content
     * chỉ tìm kiếm ở dashboard nên ko truyền folder id nữa
     */
    async searchByKeyword(keyword: string, userId: string): Promise<Note[]> {
        const normalizedKeyword = keyword.trim().toLowerCase();
        if (!normalizedKeyword) {
            return [];
        }

        const query = `
    SELECT n.*, 
      COALESCE(
        ARRAY_AGG(nt.tag_name) FILTER (WHERE nt.tag_name IS NOT NULL),
        '{}'
      ) AS tags
    FROM notes n
    LEFT JOIN note_tags nt ON n.note_id = nt.note_id
    WHERE
      n.user_id = $2
      AND (
        LOWER(n.title) LIKE '%' || $1 || '%'
        OR LOWER(n.content) LIKE '%' || $1 || '%'
      )
    GROUP BY n.note_id
    ORDER BY n.updated_at DESC
  `;

        const params = [normalizedKeyword, userId];
        const result = await dbClient.queryObject(query, params);

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

    private isUploadedInputFile(
        obj: Attachment | UploadedInputFile,
    ): obj is UploadedInputFile {
        return (obj as UploadedInputFile).originalname !== undefined;
    }
}
