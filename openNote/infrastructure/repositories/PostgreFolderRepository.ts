import { Folder } from "../../domain/entities/Folder.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { getPool } from "../db/postgresClient.ts";
import { QueryObjectResult, Transaction } from "pg";

/**
 * PostgreSQL implementation of FolderRepository.
 */
export class PostgreFolderRepository implements FolderRepository {
  constructor(private tx?: Transaction) {}

  // helper for getting the correct query runner
  private async executeQuery<T>(
    query: string,
    args: any[] = [],
  ): Promise<QueryObjectResult<T>> {
    if (this.tx) {
      return await this.tx.queryObject<T>(query, args);
    } else {
      // create a new client from the pool
      const client = await (await getPool()).connect();
      try {
        return await client.queryObject<T>(query, args);
      } finally {
        // release the client back to the pool
        client.release();
      }
    }
  }

  findAll(userId: string): Promise<Folder[]> {
    return this.executeQuery(
      `
      SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at
      FROM folders
      WHERE user_id = $1
      ORDER BY updated_at DESC
      `,
      [userId],
    ).then((result) => result.rows.map((row) => this.mapRowToFolder(row)));
  }

  /**
   * find folder by its id
   */
  async findById(id: string): Promise<Folder | null> {
    const result = await this.executeQuery(
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
    userId: string,
  ): Promise<Folder[]> {
    if (!parentFolderId) {
      // return all folders gốc (không có parent)
      const result = await this.executeQuery(
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

    // return subfolders of the given parentFolderId
    const result = await this.executeQuery(
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

  // no need to use unit of work here
  async cutFolder(
    folderId: string,
    userId: string,
    newParentFolderId?: string,
  ): Promise<boolean> {
    if (folderId === newParentFolderId) {
      throw new Error("Cannot move a folder into itself.");
    }

    const client = await (await getPool()).connect();
    const tx = client.createTransaction("cut_folder_tx");
    try {
      await tx.begin();

      // check xem folder cần di chuyển có thuộc về user ko
      const folderToMove = await tx.queryObject<{ user_id: string }>(
        `SELECT user_id FROM folders WHERE folder_id = $1`,
        [folderId],
      );
      if (
        folderToMove.rows.length === 0 ||
        folderToMove.rows[0].user_id !== userId
      ) {
        throw new Error("Folder not found or you don't have permission.");
      }

      // thực hiện di chuyển folder
      if (newParentFolderId) {
        // xem folder đích có tồn tại và cũng thuộc về user
        const parentFolder = await tx.queryObject<{ user_id: string }>(
          `SELECT user_id FROM folders WHERE folder_id = $1`,
          [newParentFolderId],
        );

        // nếu folder đích ko tồn tại hoặc ko thuộc về user
        if (
          parentFolder.rows.length === 0 ||
          parentFolder.rows[0].user_id !== userId
        ) {
          throw new Error(
            "Target folder not found or you don't have permission.",
          );
        }

        // kiem tra xem target folder co phai la con cua folder dang move ko
        const checkCycle = await tx.queryObject<{ folder_id: string }>(
          // tìm cha của thư mục đích
          // then kiểm tra xem thư mục đang được cut có phải ancesstor của thư mục đích ko
          `
        WITH RECURSIVE ancestors AS (
          SELECT folder_id, parent_folder_id
          FROM folders
          WHERE folder_id = $1
          UNION ALL
          SELECT f.folder_id, f.parent_folder_id
          FROM folders f
          JOIN ancestors a ON f.folder_id = a.folder_id
        )
        SELECT folder_id FROM subfolders WHERE folder_id = $2
        `,
          [newParentFolderId, folderId],
        );

        if (checkCycle.rows.length > 0) {
          throw new Error("Cannot move a folder into its own subfolder.");
        }
      }

      // all pass => thực hiện cut
      await tx.queryObject(
        `
      UPDATE folders
      SET parent_folder_id = $1, updated_at = NOW()
      WHERE folder_id = $2 AND user_id = $3
      `,
        [newParentFolderId, folderId, userId],
      );

      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
    return true; // true nếu cut thành công
  }

  /**
   * create or update folder
   */
  async save(folder: Folder): Promise<void> {
    await this.executeQuery(
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
    if (!this.tx) {
      throw new Error("save method must be called within a transaction.");
    }

    await this.tx.queryObject(`DELETE FROM folders WHERE folder_id = $1`, [id]);

    // cascade delete handled by foreign key constraints in the database
    // notes in the folder will be deleted automatically
    // tags associated with those notes will also be cleaned up in note_tags table
    // orphan tags will be handled in the tag repository
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
      AND search_tsv @@ plainto_tsquery('simple', $1)
    ORDER BY updated_at DESC
  `;

    const result = await this.executeQuery(query, [normalizedKeyword, userId]);

    return result.rows.map((row) => this.mapRowToFolder(row));
  }

  /**
   * Map SQL row to Folder entity
   */
  private mapRowToFolder(row: any): Folder {
    return new Folder(
      row.folder_name,
      row.user_id,
      row.parent_folder_id,
      row.folder_id,
      row.created_at,
      row.updated_at,
    );
  }
}
