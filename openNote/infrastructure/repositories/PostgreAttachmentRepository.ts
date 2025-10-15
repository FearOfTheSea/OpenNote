import { AttachmentRepository } from "../../application/repositories/AttachmentRepository.ts";
import { Attachment } from "../../domain/entities/Attachment.ts";
import dbClient from "../db/postgresClient.ts";

export class PostgreAttachmentRepository implements AttachmentRepository {
    async save(attachment: Attachment): Promise<void> {
        const query = `
            INSERT INTO attachments (attachment_id, note_id, path, file_name, size, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (attachment_id) DO UPDATE
            SET path = EXCLUDED.path,
                file_name = EXCLUDED.file_name,
                size = EXCLUDED.size
        `;
        await dbClient.queryObject(query, [
            attachment.id,
            attachment.noteId,
            attachment.path,
            attachment.fileName,
            attachment.size,
            attachment.createdAt,
        ]);
    }

    async findById(id: string): Promise<Attachment | null> {
        const query = `SELECT * FROM attachments WHERE attachment_id = $1`;
        const result = await dbClient.queryObject(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToAttachment(result.rows[0]);
    }

    async findByNoteId(noteId: string): Promise<Attachment[]> {
        const query = `SELECT * FROM attachments WHERE note_id = $1 ORDER BY created_at ASC`;
        const result = await dbClient.queryObject(query, [noteId]);

        return result.rows.map((row) => this.mapRowToAttachment(row));
    }

    async delete(id: string): Promise<void> {
        const query = `DELETE FROM attachments WHERE attachment_id = $1`;
        await dbClient.queryObject(query, [id]);
    }

    /**
     * convert db rows into entity Attachment
     */
    private mapRowToAttachment(row: any): Attachment {
        return new Attachment({
            id: row.attachment_id,
            noteId: row.note_id,
            path: row.path,
            fileName: row.file_name,
            size: row.size,
            createdAt: row.created_at,
        });
    }
}
