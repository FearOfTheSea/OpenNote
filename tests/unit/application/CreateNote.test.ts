import { CreateNote, CreateNoteInput } from '../../../openNote/application/useCases/note/CreateNote';
import { Note } from '../../../openNote/domain/entities/Note';
import { NoteRepository } from '../../../openNote/application/repositories/NoteRepository';

// Mock the NoteRepository
const mockNoteRepository: jest.Mocked<NoteRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    // Add other repository methods as needed
};

describe('CreateNote use case', () => {
    let createNote: CreateNote;

    beforeEach(() => {
        createNote = new CreateNote(mockNoteRepository);
        jest.clearAllMocks();
    });

    it('creates a note with all provided values', async () => {
        const input: CreateNoteInput = {
            name: 'My Test Note',
            content: 'This is test content',
            folderId: 'folder-123',
            tagsId: ['tag1', 'tag2', 'tag3']
        };

        const result = await createNote.execute(input);

        expect(mockNoteRepository.save).toHaveBeenCalledTimes(1);
        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;

        expect(savedNote.name).toBe('My Test Note');
        expect(savedNote.content).toBe('This is test content');
        expect(savedNote.folderId).toBe('folder-123');
        expect(savedNote.tagsId).toEqual(['tag1', 'tag2', 'tag3']);
        expect(savedNote.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(result.id).toBe(savedNote.id);
    });

    it('creates a note with minimal required fields', async () => {
        const input: CreateNoteInput = {
            name: 'Minimal Note',
            content: 'Simple content'
        };

        const result = await createNote.execute(input);

        expect(mockNoteRepository.save).toHaveBeenCalledTimes(1);
        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;

        expect(savedNote.name).toBe('Minimal Note');
        expect(savedNote.content).toBe('Simple content');
        expect(savedNote.folderId).toBeUndefined();
        expect(savedNote.tagsId).toEqual([]);
        expect(result.id).toBe(savedNote.id);
    });

    it('handles empty tagsId array when provided explicitly', async () => {
        const input: CreateNoteInput = {
            name: 'No Tags Note',
            content: 'Content without tags',
            tagsId: []
        };

        const result = await createNote.execute(input);

        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;
        expect(savedNote.tagsId).toEqual([]);
    });

    it('trims the note name', async () => {
        const input: CreateNoteInput = {
            name: '   Trimmed Name   ',
            content: 'Content'
        };

        await createNote.execute(input);

        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;
        expect(savedNote.name).toBe('Trimmed Name');
    });

    it('throws error when name is empty', async () => {
        const input: CreateNoteInput = {
            name: '',
            content: 'Content'
        };

        await expect(createNote.execute(input)).rejects.toThrow('Note name cannot be empty');
        expect(mockNoteRepository.save).not.toHaveBeenCalled();
    });

    it('throws error when name is only whitespace', async () => {
        const input: CreateNoteInput = {
            name: '   ',
            content: 'Content'
        };

        await expect(createNote.execute(input)).rejects.toThrow('Note name cannot be empty');
        expect(mockNoteRepository.save).not.toHaveBeenCalled();
    });

    it('handles repository save failure', async () => {
        const input: CreateNoteInput = {
            name: 'Valid Note',
            content: 'Valid content'
        };

        const saveError = new Error('Database connection failed');
        mockNoteRepository.save.mockRejectedValueOnce(saveError);

        await expect(createNote.execute(input)).rejects.toThrow('Database connection failed');
    });

    it('returns the generated note id', async () => {
        const input: CreateNoteInput = {
            name: 'Test Note',
            content: 'Test content'
        };

        const result = await createNote.execute(input);

        expect(result).toHaveProperty('id');
        expect(typeof result.id).toBe('string');
        expect(result.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it('creates note with folderId but no tags', async () => {
        const input: CreateNoteInput = {
            name: 'Folder Note',
            content: 'In a folder',
            folderId: 'folder-456'
        };

        await createNote.execute(input);

        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;
        expect(savedNote.folderId).toBe('folder-456');
        expect(savedNote.tagsId).toEqual([]);
    });

    it('creates note with tags but no folder', async () => {
        const input: CreateNoteInput = {
            name: 'Tagged Note',
            content: 'With tags only',
            tagsId: ['important', 'work']
        };

        await createNote.execute(input);

        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;
        expect(savedNote.folderId).toBeUndefined();
        expect(savedNote.tagsId).toEqual(['important', 'work']);
    });

    it('handles empty content', async () => {
        const input: CreateNoteInput = {
            name: 'Empty Content Note',
            content: ''
        };

        const result = await createNote.execute(input);

        const savedNote = mockNoteRepository.save.mock.calls[0][0] as Note;
        expect(savedNote.content).toBe('');
        expect(result.id).toBe(savedNote.id);
    });
});