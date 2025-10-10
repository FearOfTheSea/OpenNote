import {NoteRepository} from "../../application/repositories/NoteRepository.ts";
import {CreateNote, CreateNoteOutput} from "../../application/useCases/note/CreateNote.ts";
import {CreateNoteInput} from "../../application/useCases/note/CreateNote.ts";

export class CreateNoteController {
    private createNoteUseCase: CreateNote;

    constructor(noteRepository: NoteRepository) {
        this.createNoteUseCase = new CreateNote(noteRepository);
    }

    async apply(note: CreateNoteInput): Promise<CreateNoteOutput> {
        return await this.createNoteUseCase.execute(note);
    }
}