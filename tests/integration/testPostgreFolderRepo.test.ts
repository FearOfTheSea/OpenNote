import { assertEquals, assert } from "@std/assert";
import { PostgreFolderRepository } from "../../openNote/infrastructure/repositories/PostgreFolderRepository.ts";
import { Folder } from "../../openNote/domain/entities/Folder.ts";
import dbClient from "../../openNote/infrastructure/db/postgresClient.ts";

/**
 * clear DB after running test
 */
async function clearTables() {
  await dbClient.queryObject(`DELETE FROM folders`);
  await dbClient.queryObject(`DELETE FROM users`);
}

/**
 * create user for testing
 */
async function createTestUser() {
  const result = await dbClient.queryObject<{ user_id: string }>(
    `
    INSERT INTO users (full_name, email, password_hash)
    VALUES ('Test User', 'manh@gmail.com', 'hash123')
    RETURNING user_id
    `
  );
  return result.rows[0].user_id;
}

/**
 * create folder for testing
 */
function createFolder(name: string, userId: string, parentId?: string) {
  return new Folder(name, userId, undefined, parentId);
}

/**
 * Repository instance
 */
const repo = new PostgreFolderRepository();

/**
 * Setup / Teardown
 */
Deno.test({
  name: "PostgreFolderRepository – findById, save, delete, search",
  async fn() {
    await clearTables();
    const userId = await createTestUser();

    // Save folder
    const folder = createFolder("My Folder", userId);
    console.log(
      "Saving folder with ID:",
      folder.id,
      "and userId:",
      folder.userId
    );
    await repo.save(folder);

    // findById
    const found = await repo.findById(folder.id);
    assert(found);
    assertEquals(found?.name, "My Folder");
    assertEquals(found?.userId, userId);

    // Update name
    const updatedFolder = new Folder("Renamed Folder", userId, folder.id);
    console.log(
      "Saving folder with ID:",
      folder.id,
      "and userId:",
      folder.userId
    );
    await repo.save(updatedFolder);

    const foundAfterUpdate = await repo.findById(folder.id);
    assertEquals(foundAfterUpdate?.name, "Renamed Folder");

    // findByUserId
    const byUser = await repo.findByUserId(userId);
    assertEquals(byUser.length, 1);
    assertEquals(byUser[0].name, "Renamed Folder");

    // Search
    const searchResult = await repo.searchByKeyword("Renamed");
    assertEquals(searchResult.length, 1);
    console.log("folder with ID:" + searchResult[0].id);
    assertEquals(searchResult[0].id, folder.id);

    // Delete
    await repo.delete(folder.id);
    const afterDelete = await repo.findById(folder.id);
    assertEquals(afterDelete, null);

    await clearTables();
  },
});

Deno.test({
  name: "PostgreFolderRepository – findByParentFolderId",
  async fn() {
    await clearTables();
    const userId = await createTestUser();

    // create parent and child folders
    const parent = createFolder("Parent", userId);
    await repo.save(parent);

    const child1 = createFolder("Child 1", userId, parent.id);
    const child2 = createFolder("Child 2", userId, parent.id);
    await repo.save(child1);
    await repo.save(child2);

    // query children
    const children = await repo.findByParentFolderId(parent.id);
    assertEquals(children.length, 2);
    const names = children.map((f) => f.name).sort();
    assertEquals(names, ["Child 1", "Child 2"]);

    // query root folders
    const roots = await repo.findByParentFolderId(undefined);
    assertEquals(roots.length, 1);
    assertEquals(roots[0].name, "Parent");

    await clearTables();
  },
});
