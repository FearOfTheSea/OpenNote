// import { Note } from '../../../openNote/domain/entities/Note';
//
// describe('Note entity', () => {
//     it('creates a note with provided values', () => {
//         const note = new Note('My Note', 'Some content', 'folder1', ['tag1', 'tag2'], 'custom-id');
//
//         expect(note.id).toBe('custom-id');
//         expect(note.name).toBe('My Note');
//         expect(note.content).toBe('Some content');
//         expect(note.folderId).toBe('folder1');
//         expect(note.tagsId).toEqual(['tag1', 'tag2']);
//     });
//
//     it('generates a UUID if id is not provided', () => {
//         const note = new Note('My Note', 'content');
//         expect(note.id).toMatch(
//             /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
//         );
//     });
//
//     it('trims the name', () => {
//         const note = new Note('   Trimmed   ', 'content');
//         expect(note.name).toBe('Trimmed');
//     });
//
//     it('throws if name is empty', () => {
//         expect(() => new Note('', 'content')).toThrow('Note name cannot be empty');
//         expect(() => new Note('   ', 'content')).toThrow('Note name cannot be empty');
//     });
//
//     it('defaults tagsId to empty array', () => {
//         const note = new Note('Note with no tags', 'content');
//         expect(note.tagsId).toEqual([]);
//     });
//
//     it('allows folderId to be undefined', () => {
//         const note = new Note('No folder', 'content');
//         expect(note.folderId).toBeUndefined();
//     });
// });
