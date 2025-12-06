import { Folder } from "../../domain/entities/Folder.ts";
import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { getPool } from "../db/postgresClient.ts";
import { QueryObjectResult, Transaction } from "pg";
import { buildSearchSyntax } from "../utils/SearchHelper.ts";

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

  async cutFolder(
    folderId: string,
    userId: string,
    newParentFolderId?: string,
  ): Promise<boolean> {
    if (folderId === newParentFolderId) {
      throw new Error("Cannot move a folder into itself.");
    }

    if (!this.tx) {
      throw new Error("cutFolder method must be called within a transaction.");
    }

    const folderToMove = await this.tx.queryObject<{
      user_id: string;
      parent_folder_id: string | null;
    }>(`SELECT user_id, parent_folder_id FROM folders WHERE folder_id = $1`, [
      folderId,
    ]);

    // nếu folder đích ko tồn tại hoặc ko thuộc về user
    if (
      folderToMove.rows.length === 0 ||
      folderToMove.rows[0].user_id !== userId
    ) {
      throw new Error("Folder not found or you don't have permission.");
    }

    const currentParentId = folderToMove.rows[0].parent_folder_id;
    const targetParentId = newParentFolderId || null;

    if (currentParentId === targetParentId) {
      return true;
    }

    // Check target va cycle: neu targetParentId la con cua folderId thi khong duoc move
    if (targetParentId) {
      const parentFolder = await this.tx.queryObject<{ user_id: string }>(
        `SELECT user_id FROM folders WHERE folder_id = $1`,
        [targetParentId],
      );

      if (
        parentFolder.rows.length === 0 ||
        parentFolder.rows[0].user_id !== userId
      ) {
        throw new Error(
          "Target folder not found or you don't have permission.",
        );
      }

      const checkCycle = await this.tx.queryObject(
        `
        WITH RECURSIVE ancestors AS (
          SELECT folder_id, parent_folder_id
          FROM folders
          WHERE folder_id = $1

          UNION ALL

          SELECT f.folder_id, f.parent_folder_id
          FROM folders f
          JOIN ancestors a ON f.folder_id = a.parent_folder_id
        )
        SELECT folder_id FROM ancestors WHERE folder_id = $2
        `,
        [targetParentId, folderId],
      );

      if (checkCycle.rows.length > 0) {
        throw new Error("Cannot move a folder into its own subfolder.");
      }
    }

    await this.tx.queryObject(
      `UPDATE folders SET parent_folder_id = $1 WHERE folder_id = $2`,
      [targetParentId, folderId],
    );
    return true;
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
      SET folder_name = EXCLUDED.folder_name

      `,
      [folder.id, folder.name, folder.userId, folder.parentFolderId],
    );
  }

  // use for backup restore
  async restore(folder: Folder): Promise<void> {
    await this.executeQuery(
      `
      INSERT INTO folders (folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (folder_id) DO UPDATE
      SET folder_name = EXCLUDED.folder_name,
          parent_folder_id = EXCLUDED.parent_folder_id,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
      `,
      [
        folder.id,
        folder.name,
        folder.userId,
        folder.parentFolderId,
        folder.createdAt,
        folder.updatedAt,
      ],
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
    if (!keyword || !keyword.trim()) {
      return [];
    }

    const searchSyntax = buildSearchSyntax(keyword);
    if (!searchSyntax) return [];

    const likeSyntax = `%${keyword.trim()}%`;

    const query = `
    SELECT folder_id, folder_name, user_id, parent_folder_id, created_at, updated_at,
    ts_rank_cd(search_tsv, to_tsquery('simple', $1)) AS rank
    FROM folders
    WHERE user_id = $2
      AND (
      search_tsv @@ to_tsquery('simple', $1)
      OR unaccent(folder_name) ILIKE unaccent($3)
      )
    ORDER BY rank DESC, updated_at DESC
  `;

    const result = await this.executeQuery(query, [
      searchSyntax,
      userId,
      likeSyntax,
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
      row.parent_folder_id,
      row.folder_id,
      row.created_at,
      row.updated_at,
    );
  }
}
