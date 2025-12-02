import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { TagRepository } from "../../application/repositories/TagRepository.ts";
import { Note } from "../../domain/entities/Note.ts";
import { Tag } from "../../domain/entities/Tag.ts";

export class InMemoryTagRepository implements TagRepository {
  private tags: Tag[] = [];
  private tagIdRefCountMap: Map<string, number> = new Map();

  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly folderRepository: FolderRepository
  ) {}

  async findAll(userId: string): Promise<Tag[]> {
    const userFolders = await this.folderRepository.findAll(userId);

    const userNotes: Note[] = [];
    for (const folder of userFolders) {
      const notesInFolder = await this.noteRepository.findByFolderId(folder.id);

      userNotes.push(...notesInFolder);
    }

    const tagIdsSet = new Set<string>();
    for (const note of userNotes) {
      for (const tagId of note.tagIds) {
        tagIdsSet.add(tagId);
      }
    }
    return this.tags.filter((tag) => tagIdsSet.has(tag.id));
  }

  async save(_tag: Tag): Promise<void> {}

  async findByName(name: string): Promise<Tag | null> {
    const foundTag = this.tags.find((t) => t.name === name);
    return foundTag || null;
  }

  async syncTagsForNoteUpdate(
    noteId: string,
    noteContent: string
  ): Promise<void> {
    const tagNamesInContent = new Set<string>();
    const lines = noteContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (/^#[^\s].*/.test(trimmedLine)) {
        const tagName = trimmedLine.slice(1).trimEnd();
        tagNamesInContent.add(tagName);
      }
    }

    const note = await this.noteRepository.findById(noteId);
    for (const tagName of tagNamesInContent) {
      const foundTag = this.tags.find((t) => t.name === tagName);

      if (foundTag && note?.tagIds.includes(foundTag.id)) {
        continue;
      }

      if (foundTag && !note?.tagIds.includes(foundTag.id)) {
        note?.tagIds.push(foundTag.id);
        this.tagIdRefCountMap.set(
          foundTag.id,
          (this.tagIdRefCountMap.get(foundTag.id) || 0) + 1
        );
        continue;
      }

      if (!foundTag) {
        const newTag = new Tag(tagName);
        this.tags.push(newTag);
        note?.tagIds.push(newTag.id);
        this.tagIdRefCountMap.set(newTag.id, 1);
      }
    }

    if (note) {
      for (let i = note.tagIds.length - 1; i >= 0; i--) {
        const tagId = note.tagIds[i];
        const tag = this.tags.find((t) => t.id === tagId);
        if (!tag || !tagNamesInContent.has(tag.name)) {
          note.tagIds.splice(i, 1);
          const currentRefCount = this.tagIdRefCountMap.get(tagId) || 0;
          this.tagIdRefCountMap.set(tagId, currentRefCount - 1);
        }
      }
    }
  }

  async deleteOrphanedTag(_id: string): Promise<void> {}

  async cleanupOrphanTags(): Promise<void> {
    // Recalculate reference counts from scratch
    const newRefCountMap = new Map<string, number>();

    const allNotes = await this.noteRepository.findAll("user");
    for (const note of allNotes) {
      for (const tagId of note.tagIds) {
        newRefCountMap.set(tagId, (newRefCountMap.get(tagId) || 0) + 1);
      }
    }

    // Remove tags with zero references
    this.tags = this.tags.filter(
      (tag) => (newRefCountMap.get(tag.id) || 0) > 0
    );
    this.tagIdRefCountMap = newRefCountMap;
  }
}
