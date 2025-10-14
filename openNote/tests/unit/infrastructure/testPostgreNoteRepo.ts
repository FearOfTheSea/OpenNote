import { assertEquals, assertNotEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { PostgreNoteRepository } from "../../../infrastructure/repositories/PostgreNoteRepository.ts";
import { Note } from "../../../domain/entities/Note.ts";

const repo = new PostgreNoteRepository();

/**
 * create note mẫu
 */
function createSampleNote(titleSuffix = "Sample"): Note {
    return new Note(
        `test Note ${titleSuffix}`,
        `this is a test note with #deno and #postgres`,
        undefined,
        [], // tags được extract tự động
    );
}

/**
 * thêm mới note vào db
 */
Deno.test("save() should insert a new note", async () => {
    const note = createSampleNote("Insert");
    await repo.save(note);

    const found = await repo.findById(note.id);
    assertNotEquals(found, null);
    assertEquals(found?.name, note.name);
});

/**
 * update note title & content
 */
Deno.test("save() should update existing note", async () => {
    const note = createSampleNote("Update");
    await repo.save(note);

    // tạo 1 note mới cùng id vì note trong domain readonly
    const updatedNote = new Note(
        note.name,
        "Updated content #updatedTag",
        note.folderId,
        note.tagsId,
        note.id,
        note.createdAt,
    );

    await repo.save(updatedNote);

    const found = await repo.findById(note.id);
    assertEquals(found?.content.includes("Updated"), true);
});

/**
 * tìm note theo tên
 */
Deno.test("findByName() should return notes with similar title", async () => {
    const note = createSampleNote("FindByName");
    await repo.save(note);

    const results = await repo.findByName("FindByName");
    assertEquals(results.length > 0, true);
});

/**
 * tìm note theo tag
 */
Deno.test("findByTag() should return notes that contain tag", async () => {
    const note = createSampleNote("Tag");
    await repo.save(note);

    const results = await repo.findByTag("deno");
    assertEquals(
        results.some((n: Note) => n.id === note.id),
        true,
    );
});

/**
 * tìm theo keyword (trong title hoặc content)
 */
Deno.test("searchByKeyword() should find notes by keyword", async () => {
    const note = createSampleNote("SearchKeyword");
    await repo.save(note);

    const results = await repo.searchByKeyword("postgres");
    assertEquals(
        results.some((n: Note) => n.id === note.id),
        true,
    );
});

/**
 * del note
 */
Deno.test("delete() should remove a note", async () => {
    const note = createSampleNote("Delete");
    await repo.save(note);

    await repo.delete(note.id);
    const found = await repo.findById(note.id);

    assertEquals(found, null);
});
