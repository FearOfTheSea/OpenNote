import { assert, assertEquals, assertThrows } from "@std/assert";
import { Note } from "../../../openNote/domain/entities/Note.ts";

Deno.test("[UNIT-NOTE] creates a note with valid data", () => {
  const note = new Note("My Note 1", "Some content", "folder-123");

  assert(typeof note.id === "string" && note.id.length > 0);
  assertEquals(note.name, "My Note 1");
  assertEquals(note.content, "Some content");
  assertEquals(note.parentFolderId, "folder-123");
  assertEquals(note.tagIds, []);
  assert(note.createdAt instanceof Date);
  assert(note.updatedAt instanceof Date);
});

Deno.test("[UNIT-NOTE] trims name", () => {
  const note = new Note("   My Note   ", "Content", "folder-123");
  assertEquals(note.name, "My Note");
});

Deno.test("[UNIT-NOTE] uses provided id when given", () => {
  const customId = "fixed-id-123";
  const note = new Note("My Note", "Content", "folder-123", [], customId);

  assertEquals(note.id, customId);
});

Deno.test("[UNIT-NOTE] uses provided tagIds", () => {
  const tags = ["tag-1", "tag-2"];
  const note = new Note("My Note", "Content", "folder-123", tags);

  assertEquals(note.tagIds, tags);
});

Deno.test("[UNIT-NOTE] throws when name is empty", () => {
  assertThrows(
    () => {
      // empty string
      // deno-lint-ignore no-explicit-any
      new Note("", "Content", "folder-123" as any);
    },
    Error,
    "Note name cannot be empty",
  );

  assertThrows(
    () => {
      // whitespace-only
      // deno-lint-ignore no-explicit-any
      new Note("   ", "Content", "folder-123" as any);
    },
    Error,
    "Note name cannot be empty",
  );
});

Deno.test("[UNIT-NOTE] throws when name is invalid (validateName fails)", () => {
  // assumes validateName rejects names with '@'
  assertThrows(
    () => {
      new Note("Invalid@Name", "Content", "folder-123");
    },
    Error,
    "Note name must be 1-255 characters long, uses only 0-9, a-Z, ., _, - and spaces",
  );
});

Deno.test("[UNIT-NOTE] throws when parentFolderId is missing", () => {
  // parentFolderId is empty string
  assertThrows(
    () => {
      // deno-lint-ignore no-explicit-any
      new Note("My Note", "Content", "" as any);
    },
    Error,
    "Parent folder id cannot be null",
  );

  // parentFolderId is undefined
  assertThrows(
    () => {
      // deno-lint-ignore no-explicit-any
      new Note("My Note", "Content", undefined as any);
    },
    Error,
    "Parent folder id cannot be null",
  );
});

Deno.test("[UNIT-NOTE] createdAt and updatedAt are Dates", () => {
  const note = new Note("My Note", "Content", "folder-123");

  assert(note.createdAt instanceof Date);
  assert(note.updatedAt instanceof Date);
});
