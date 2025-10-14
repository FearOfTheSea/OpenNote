import { Folder } from "../../domain/entities/Folder.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import dbClient from "../db/postgresClient.ts";

/**
 * PostgreSQL implementation of FolderRepository.
 */
export class PostgreFolderRepository implements FolderRepository {
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
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToFolder(result.rows[0]);
  }

  /**
   * find folders by user_id
   */
  async findByUserId(id: string): Promise<Folder[]> {
    const result = await dbClient.queryObject(
      `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
      [id]
    );

    return result.rows.map((row) => this.mapRowToFolder(row));
  }

  /**
   * find subfolders by parent_folder_id
   */
  async findByParentFolderId(
    parentFolderId: string | undefined
  ): Promise<Folder[]> {
    if (!parentFolderId) {
      // folders gốc (không có parent)
      const result = await dbClient.queryObject(
        `
        SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
        FROM folders
        WHERE parent_folder_id IS NULL
        ORDER BY updated_at DESC
        `
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
      [parentFolderId]
    );

    return result.rows.map((row) => this.mapRowToFolder(row));
  }

  /**
   * find all folders
   */
  async findAll(): Promise<Folder[]> {
    const result = await dbClient.queryObject(
      `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      ORDER BY updated_at DESC
      `
    );

    return result.rows.map((row) => this.mapRowToFolder(row));
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
      [folder.id, folder.name, folder.userId, folder.parentFolderId]
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
  async searchByKeyword(keyword: string): Promise<Folder[]> {
    const result = await dbClient.queryObject(
      `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      WHERE LOWER(folder_name) LIKE LOWER('%' || $1 || '%')
      ORDER BY updated_at DESC
      `,
      [keyword]
    );

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
      row.updated_at
    );
  }
}
