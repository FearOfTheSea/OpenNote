import { Note } from '../../../domain/entities/Note';
import { Tag } from '../../../domain/entities/Tag';
import { TagRepository } from '../../repositories/TagRepository';
import { NoteRepository } from '../../repositories/NoteRepository';

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