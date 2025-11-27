import { PostgreNoteRepository } from "../../openNote/infrastructure/repositories/PostgreNoteRepository.ts";
import { Note } from "../../openNote/domain/entities/Note.ts";
import { assert, assertArrayIncludes, assertEquals, assertExists } from "@std/assert";
import dbClient from "../../openNote/infrastructure/db/postgresClient.ts";

// --- Dữ liệu test với UUIDs hợp lệ ---
const USER_1_ID = "1a9c4a5c-12a9-459c-a185-111111111111";
const USER_2_ID = "1a9c4a5c-12a9-459c-a185-222222222222";

const FOLDER_1_ID = "2b8d4a5c-12a9-459c-a185-111111111111";
const FOLDER_2_ID = "2b8d4a5c-12a9-459c-a185-222222222222";
const FOLDER_3_ID = "2b8d4a5c-12a9-459c-a185-333333333333";

const NOTE_1_ID = "3c7e4a5c-12a9-459c-a185-111111111111";
const NOTE_2_ID = "3c7e4a5c-12a9-459c-a185-222222222222";
const NOTE_3_ID = "3c7e4a5c-12a9-459c-a185-333333333333";
const NOTE_4_ID = "3c7e4a5c-12a9-459c-a185-444444444444";

const TAG_1_ID = "4d6f4a5c-12a9-459c-a185-111111111111";
const TAG_2_ID = "4d6f4a5c-12a9-459c-a185-222222222222";
const TAG_3_ID = "4d6f4a5c-12a9-459c-a185-333333333333";

const setupDatabase = async () => {
    await dbClient.queryObject(`
    TRUNCATE TABLE users, folders, notes, tags, note_tags, attachments RESTART IDENTITY CASCADE;
  `);

    await dbClient.queryObject(`
    INSERT INTO users (user_id, full_name, email, password_hash) VALUES
      ('${USER_1_ID}', 'manh1', 'test1@example.com', 'pass'),
      ('${USER_2_ID}', 'manh2', 'test2@example.com', 'pass');
  `);

    await dbClient.queryObject(`
    INSERT INTO folders (folder_id, folder_name, user_id) VALUES
      ('${FOLDER_1_ID}', 'Work', '${USER_1_ID}'),
      ('${FOLDER_2_ID}', 'Personal', '${USER_1_ID}'),
      ('${FOLDER_3_ID}', 'Other User Folder', '${USER_2_ID}');
  `);

    await dbClient.queryObject(`
    INSERT INTO notes (note_id, title, content, folder_id, created_at, updated_at) VALUES
      ('${NOTE_1_ID}', 'Meeting Notes', 'Content about Deno', '${FOLDER_1_ID}', '2025-10-23 10:00:00', '2025-10-23 10:00:00'),
      ('${NOTE_2_ID}', 'Shopping List', 'Milk and Bread', '${FOLDER_2_ID}', '2025-10-23 11:00:00', '2025-10-23 11:00:00'),
      ('${NOTE_3_ID}', 'Project Ideas', 'Some great ideas', '${FOLDER_1_ID}', '2025-10-23 12:00:00', '2025-10-23 12:00:00');
  `);

    await dbClient.queryObject(`
    INSERT INTO tags (tag_id, tag_name) VALUES
      ('${TAG_1_ID}', 'important'),
      ('${TAG_2_ID}', 'work'),
      ('${TAG_3_ID}', 'personal');
  `);

    await dbClient.queryObject(`
    INSERT INTO note_tags (note_id, tag_id) VALUES
      ('${NOTE_1_ID}', '${TAG_1_ID}'),
      ('${NOTE_1_ID}', '${TAG_2_ID}'),
      ('${NOTE_3_ID}', '${TAG_2_ID}');
  `);
};

// =============================================================================
// TEST SUITE
// =============================================================================
Deno.test({
    name: "PostgreNoteRepository - Integration Tests",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: async (t) => {
        const repository = new PostgreNoteRepository();
        await setupDatabase();

        await t.step(
            "findAll should retrieve all notes for a specific user",
            async () => {
                const notes = await repository.findAll(USER_1_ID);
                assertEquals(notes.length, 3);
                assertEquals(notes[0].id, NOTE_3_ID);
            },
        );

        await t.step(
            "findById should retrieve a correct note with its tags",
            async () => {
                const note = await repository.findById(NOTE_1_ID);
                assertExists(note);
                assertEquals(note.name, "Meeting Notes");
                assertEquals(note.tagIds.length, 2);
                assertArrayIncludes(note.tagIds, [TAG_1_ID, TAG_2_ID]);
            },
        );

        await t.step(
            "findByFolderId should retrieve notes within a folder",
            async () => {
                const notes = await repository.findByFolderId(FOLDER_1_ID);
                assertEquals(notes.length, 2);
            },
        );

        await t.step(
            "findByTagsIds should find notes matching any of the given tags",
            async () => {
                const notes = await repository.findByTagsIds(
                    [TAG_1_ID, TAG_3_ID],
                    USER_1_ID,
                );
                assertEquals(notes.length, 1);
                assertEquals(notes[0].id, NOTE_1_ID);
            },
        );

        await t.step(
            "save should create a new note within a transaction",
            async () => {
                const tx = dbClient.createTransaction("test_save_create");
                await tx.begin();
                const repoInTx = new PostgreNoteRepository(tx);
                const newNote = new Note(
                    "A Brand New Note",
                    "Content",
                    FOLDER_2_ID,
                    [],
                    NOTE_4_ID,
                );
                await repoInTx.save(newNote);
                await tx.commit();
                const savedNote = await repository.findById(NOTE_4_ID);
                assertExists(savedNote);
            },
        );

        await t.step(
            "delete should remove a note within a transaction",
            async () => {
                const tx = dbClient.createTransaction("test_delete");
                await tx.begin();
                const repoInTx = new PostgreNoteRepository(tx);
                await repoInTx.delete(NOTE_2_ID);
                await tx.commit();
                const deletedNote = await repository.findById(NOTE_2_ID);
                assertEquals(deletedNote, null);
            },
        );

        await t.step("cutNote should move a note to another folder", async () => {
            const success = await repository.cutNote(NOTE_3_ID, FOLDER_2_ID);
            assert(success);
            const movedNote = await repository.findById(NOTE_3_ID);
            assertEquals(movedNote?.parentFolderId, FOLDER_2_ID);
        });
    },
});

addEventListener("afterall", async () => {
    console.log("closing db client...");
    await dbClient.end();
});
