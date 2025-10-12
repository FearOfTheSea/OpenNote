import { NoteRepository } from "../../application/repositories/NoteRepository.ts";
import { Note } from "../../domain/entities/Note.ts";

export class InMemoryNoteRepository implements NoteRepository {
  private notes: Note[] = [];

  async findById(id: string): Promise<Note | null> {
    const note = this.notes.find((n) => n.id === id);
    return note || null;
  }

  async findByName(name: string): Promise<Note[]> {
    const foundNotes: Note[] = [];
    for (const note of this.notes) {
      if (note.name === name) {
        foundNotes.push(note);
      }
    }
    return foundNotes;
  }

  async findByFolderId(folderId: string): Promise<Note[]> {
    const foundNotes: Note[] = [];
    for (const note of this.notes) {
      if (note.folderId === folderId) {
        foundNotes.push(note);
      }
    }
    return foundNotes;
  }

  async findByTag(tagId: string): Promise<Note[]> {
    const foundNotes: Note[] = [];
    for (const note of this.notes) {
      if (note.tagsId.includes(tagId)) {
        foundNotes.push(note);
      }
    }
    return foundNotes;
  }

  async findAll(): Promise<Note[]> {
    return this.notes;
  }

  async save(note: Note): Promise<void> {
    const existingNoteIndex = this.notes.findIndex((n) => n.id === note.id);

    if (existingNoteIndex === -1) {
      this.notes.push(note);
    } else {
      this.notes[existingNoteIndex] = note;
    }
  }

  async delete(id: string): Promise<void> {
    this.notes = this.notes.filter((note) => note.id !== id);
  }

  async searchByKeyword(keyword: string): Promise<Note[]> {
    const foundNotes: Note[] = [];
    for (const note of this.notes) {
      if (
        note.name.toLowerCase().includes(keyword.toLowerCase()) ||
        note.content.toLowerCase().includes(keyword.toLowerCase())
      ) {
        foundNotes.push(note);
      }
    }
    return foundNotes;
  }
}
