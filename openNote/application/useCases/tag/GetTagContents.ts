import { Note } from '../../../domain/entities/Note.ts';
import { Tag } from '../../../domain/entities/Tag.ts';
import { TagRepository } from '../../repositories/TagRepository.ts';
import { NoteRepository } from '../../repositories/NoteRepository.ts';

export interface GetTagContentsInput {
    tagId: string;
}

export interface GetTagContentsOutput {
    tag: Tag | null;
    notes: Note[];
}

export class GetTagContents {
    constructor(
        private tagRepository: TagRepository,
        private noteRepository: NoteRepository
    ) {}

    async execute(input: GetTagContentsInput): Promise<GetTagContentsOutput> {
        const [tag, allNotes] = await Promise.all([
            this.tagRepository.findById(input.tagId),
            this.noteRepository.findAll()
        ]);

        const notes = allNotes.filter(note =>
            note.tagsId.includes(input.tagId)
        );

        return { tag, notes };
    }
}