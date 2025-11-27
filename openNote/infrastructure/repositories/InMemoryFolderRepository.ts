import { FolderRepository } from "../../application/repositories/FolderRepository.ts";
import { Folder } from "../../domain/entities/Folder.ts";
import { NoteRepository } from "../../application/repositories/NoteRepository.ts";

export class InMemoryFolderRepository implements FolderRepository {
  private folders: Folder[] = [];

  findAll(userId: string): Promise<Folder[]> {
    return Promise.resolve(this.folders.filter((folder) => folder.userId === userId));
  }

  findById(id: string): Promise<Folder | null> {
    const folder = this.folders.find((folder) => folder.id === id);
    return folder ? Promise.resolve(folder) : Promise.resolve(null);
  }

  findByName(name: string, userId: string): Promise<Folder[]> {
    return Promise.resolve(
      this.folders.filter((folder) => folder.name.includes(name.trim()) && folder.userId === userId),
    );
  }

  findByParentFolderId(parentFolderId: string | undefined, userId: string): Promise<Folder[]> {
    return Promise.resolve(
      this.folders.filter((folder) => folder.parentFolderId === parentFolderId && folder.userId === userId),
    );
  }

  cutFolder(folderId: string, _userId: string, newParentFolderId: string | undefined): Promise<boolean> {
    const folder = this.folders.find((f) => f.id === folderId);
    if (!folder) {
      return Promise.resolve(false);
    }

    const newFolder = new Folder(
      folder.name,
      folder.userId,
      newParentFolderId,
      folder.id,
    );

    const oldFolderIndex = this.folders.findIndex((f) => f.id === folderId);
    if (oldFolderIndex !== -1) {
      this.folders[oldFolderIndex] = newFolder;
    }

    return Promise.resolve(true);
  }

  save(folder: Folder): Promise<void> {
    const existingFolderIndex = this.folders.findIndex((n) => n.id === folder.id);

    if (existingFolderIndex === -1) {
      this.folders.push(folder);
    } else {
      this.folders[existingFolderIndex] = folder;
    }

    return Promise.resolve();
  }

  async delete(id: string, noteRepository: NoteRepository): Promise<void> {
    // Find all subfolders recursively
    const foldersToDelete = new Set<string>([id]);
    let foundNew = true;

    while (foundNew) {
      foundNew = false;
      for (const folder of this.folders) {
        if (
          folder.parentFolderId && foldersToDelete.has(folder.parentFolderId) &&
          !foldersToDelete.has(folder.id)
        ) {
          foldersToDelete.add(folder.id);
          foundNew = true;
        }
      }
    }

    // Delete all notes in these folders if noteRepository is available
    if (noteRepository) {
      const allNotes = await noteRepository.findAll("user");
      for (const note of allNotes) {
        if (foldersToDelete.has(note.parentFolderId)) {
          await noteRepository.delete(note.id);
        }
      }
    }

    // Delete all folders
    this.folders = this.folders.filter((folder) => !foldersToDelete.has(folder.id));
  }
}
