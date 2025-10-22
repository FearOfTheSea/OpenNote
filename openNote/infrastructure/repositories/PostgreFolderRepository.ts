import { Folder } from "../../domain/entities/Folder.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import dbClient from "../db/postgresClient.ts";

/**
 * PostgreSQL implementation of FolderRepository.
 */
export class PostgreFolderRepository implements FolderRepository {
    constructor(private noteRepository?: any) {} // inject NoteRepository nếu cần
    /**
     * find folder by its id
     */
    async findById(id: string): Promise<Folder | null> {
        const result = await dbClient.queryObject(
            `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      WHERE folder_id = $1
      `,
            [id],
        );

        if (result.rows.length === 0) return null;
        return this.mapRowToFolder(result.rows[0]);
    }

    /**
     * find subfolders by parent_folder_id
     */
    async findByParentFolderId(
        parentFolderId: string | undefined,
    ): Promise<Folder[]> {
        if (!parentFolderId) {
            // folders gốc (không có parent)
            const result = await dbClient.queryObject(
                `
        SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
        FROM folders
        WHERE parent_folder_id IS NULL
        ORDER BY updated_at DESC
        `,
            );
            return result.rows.map((row) => this.mapRowToFolder(row));
        }

        const result = await dbClient.queryObject(
            `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      WHERE parent_folder_id = $1
      ORDER BY updated_at DESC
      `,
            [parentFolderId],
        );

        return result.rows.map((row) => this.mapRowToFolder(row));
    }

    /**
     * find all root folder by user id
     */
    public async findParentFolders(userId: string): Promise<Folder[]> {
        const result = await dbClient.queryObject(
            `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      WHERE user_id = $1 AND parent_folder_id IS NULL
      ORDER BY updated_at DESC
      `,
            [userId],
        );

        return result.rows.map((row) => this.mapRowToFolder(row));
    }

    async cutFolder(
        folderId: string,
        newParentFolderId?: string,
    ): Promise<boolean> {
        const result = await dbClient.queryObject`
    UPDATE folders
    SET parent_folder_id = ${newParentFolderId}, updated_at = NOW()
    WHERE folder_id = ${folderId}
    RETURNING folder_id
  `;
        return result.rows.length > 0; // true nếu cut thành công
    }

    // tìm tất cả các thư mục con của một thư mục
    async findChildren(parentFolderId: string): Promise<Folder[]> {
        const result = await dbClient.queryObject(
            `
    SELECT * FROM folders
    WHERE parent_folder_id = $1
    ORDER BY name
    `,
            [parentFolderId],
        );

        return result.rows.map((r: any) => this.mapRowToFolder(r));
    }

    async copyFolder(
        folderId: string,
        newParentFolderId?: string,
    ): Promise<Folder> {
        const originalFolder = await this.findById(folderId);
        if (!originalFolder) {
            throw new Error(`Folder with id ${folderId} not found.`);
        }

        // create new folder with same properties
        // but new name and parent id
        const newFolder = new Folder(
            `${originalFolder.name} (copy)`,
            originalFolder.userId,
            undefined,
            newParentFolderId,
        );

        await this.save(newFolder);

        // copy all note trong folder gốc sang folder mới (nếu có)
        if (this.noteRepository) {
            const notes = await this.noteRepository.findByFolderId(folderId);
            for (const note of notes) {
                // noteRepository.copyNote(noteId, targetFolderId) có sẵn
                // copyNote sẽ copy cả attachments
                await this.noteRepository.copyNote(note.id, newFolder.id);
            }
        }
        // take children folders and copy recursively
        const childFolders = await this.findChildren(folderId);
        for (const child of childFolders) {
            await this.copyFolder(child.id, newFolder.id);
        }

        return newFolder;
    }

    /**
     * create or update folder
     */
    async save(folder: Folder): Promise<void> {
        await dbClient.queryObject(
            `
      INSERT INTO folders (folder_id, folder_name, user_id, parent_folder_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (folder_id) DO UPDATE
      SET folder_name = EXCLUDED.folder_name,
          parent_folder_id = EXCLUDED.parent_folder_id
      `,
            [folder.id, folder.name, folder.userId, folder.parentFolderId],
        );
    }

    /**
     * delete folder by id
     */
    async delete(id: string): Promise<void> {
        await dbClient.queryObject(`DELETE FROM folders WHERE folder_id = $1`, [
            id,
        ]);
    }

    /**
     * search folders by keyword in folder_name
     */
    async findByName(keyword: string, userId: string): Promise<Folder[]> {
        const normalizedKeyword = keyword.trim().toLowerCase();
        if (!normalizedKeyword) {
            return [];
        }

        const query = `
    SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
    FROM folders
    WHERE user_id = $2
      AND LOWER(folder_name) LIKE '%' || $1 || '%'
    ORDER BY updated_at DESC
  `;

        const result = await dbClient.queryObject(query, [
            normalizedKeyword,
            userId,
        ]);

        return result.rows.map((row) => this.mapRowToFolder(row));
    }

    /**
     * Map SQL row to Folder entity
     */
    private mapRowToFolder(row: any): Folder {
        return new Folder(
            row.folder_name,
            row.user_id,
            row.folder_id,
            row.parent_folder_id,
            row.created_at,
            row.updated_at,
        );
    }
}
