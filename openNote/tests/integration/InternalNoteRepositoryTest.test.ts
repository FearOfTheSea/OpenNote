import {InMemoryNoteRepository} from '../../infrastructure/InMemoryNoteRepository';
import {Note} from '../../domain/entities/Note';

describe('InMemoryNoteRepository', () => {
    let repository: InMemoryNoteRepository;

    // Set up a fresh repository before each test
    beforeEach(() => {
        repository = new InMemoryNoteRepository();
    });

    // Test for saving a note
    it('should save a note', async () => {
        const note: Note = {
            name: "My note",
            content: "my note's content",
            id: "712361263",
            tagsId: ["123812312"],
            folderId: "1231231283"
        };

        await repository.save(note);

        const savedNote = await repository.findById('712361263');
        expect(savedNote).toEqual(note);
    });

    // Test for finding a note by ID
    it('should find a note by ID', async () => {
        const note: Note = {
            name: "My note",
            content: "my note's content",
            id: "1",
            tagsId: ["12"],
            folderId: "123"
        };

        await repository.save(note);

        const foundNote = await repository.findById('1');
        expect(foundNote).toEqual(note);
    });

    // Test for finding a non-existent note
    it('should return null if note is not found', async () => {
        const foundNote = await repository.findById('non-existent-id');
        expect(foundNote).toBeNull();
    });

    // Test for getting all notes
    it('should get all notes', async () => {
        const note1: Note = {
            name: "Test note 1",
            content: "note 1 content",
            id: "1",
            tagsId: [""],
            folderId: "1"
        };
        const note2: Note = {
            name: "Test note 2",
            content: "note 2 content",
            id: "2",
            tagsId: [""],
            folderId: "1"
        };

        await repository.save(note1);
        await repository.save(note2);

        const allNotes = await repository.findAll();
        expect(allNotes).toHaveLength(2);
        expect(allNotes).toContainEqual(note1);
        expect(allNotes).toContainEqual(note2);
    });

    // Test for deleting a note
    it('should delete a note by ID', async () => {
        const note: Note = {
            name: "Test note",
            content: "note content",
            id: "1",
            tagsId: [""],
            folderId: "1"
        };

        await repository.save(note);

        // Delete the note
        await repository.delete('1');

        const deletedNote = await repository.findById('1');
        expect(deletedNote).toBeNull();
    });

    // Test for deleting a non-existent note
    it('should not throw error when deleting a non-existent note', async () => {
        const nonExistentId = 'non-existent-id';

        // Deleting a non-existent note should not throw an error
        await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });
});
