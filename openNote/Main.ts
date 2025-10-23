// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { dirname, fromFileUrl, join } from "@std/path";
import { folderRepository, noteRepository, tagRepository } from "./ApplicationContext.ts";

import { CreateFolderController } from "./interface/controllers/folder/CreateFolderController.ts";
import { DeleteFolderController } from "./interface/controllers/folder/DeleteFolderController.ts";
import { GetAllFoldersController } from "./interface/controllers/folder/GetAllFoldersController.ts";
import { GetFolderByIdController } from "./interface/controllers/folder/GetFolderByIdController.ts";
import { GetFolderContentsController } from "./interface/controllers/folder/GetFolderContentsController.ts";
import { SearchFoldersController } from "./interface/controllers/folder/SearchFoldersController.ts";
import { UpdateFolderController } from "./interface/controllers/folder/UpdateFolderController.ts";
import { CreateNoteController } from "./interface/controllers/note/CreateNoteController.ts";
import { DeleteNoteController } from "./interface/controllers/note/DeleteNoteController.ts";
import { GetAllNotesController } from "./interface/controllers/note/GetAllNotesController.ts";
import { GetNoteByIdController } from "./interface/controllers/note/GetNoteByIdController.ts";
import { GetNotesByTagsController } from "./interface/controllers/note/GetNotesByTagsController.ts";
import { SearchNotesController } from "./interface/controllers/note/SearchNotesController.ts";
import { UpdateNoteController } from "./interface/controllers/note/UpdateNoteController.ts";
import { CreateTagController } from "./interface/controllers/tag/CreateTagController.ts";
import { DeleteTagController } from "./interface/controllers/tag/DeleteTagController.ts";
import { GetAllTagsController } from "./interface/controllers/tag/GetAllTagsController.ts";
import { GetTagByIdController } from "./interface/controllers/tag/GetTagByIdController.ts";
import { SearchTagsController } from "./interface/controllers/tag/SearchTagsController.ts";
import { UpdateTagController } from "./interface/controllers/tag/UpdateTagController.ts";

import { createNoteRoutes } from "./routes/NoteRoutes.ts";
import { createFolderRoutes } from "./routes/FolderRoutes.ts";
import { createTagRoutes } from "./routes/TagRoutes.ts";
import { createViewRoutes } from "./routes/ViewRoutes.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "interface/web/public")));

const port = 3000;

app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

// Initialize controllers
const createNoteController = new CreateNoteController(noteRepository, folderRepository, tagRepository);
const getAllNotesController = new GetAllNotesController(noteRepository);
const getNoteByIdController = new GetNoteByIdController(noteRepository);
const updateNoteController = new UpdateNoteController(noteRepository, folderRepository, tagRepository);
const deleteNoteController = new DeleteNoteController(noteRepository);
const searchNotesController = new SearchNotesController(noteRepository);
const getNotesByTagsController = new GetNotesByTagsController(noteRepository, tagRepository);

const createFolderController = new CreateFolderController(folderRepository);
const getFolderByIdController = new GetFolderByIdController(folderRepository);
const getAllFoldersController = new GetAllFoldersController(folderRepository);
const updateFolderController = new UpdateFolderController(folderRepository);
const deleteFolderController = new DeleteFolderController(folderRepository);
const getFolderContentsController = new GetFolderContentsController(folderRepository, noteRepository);
const searchFoldersController = new SearchFoldersController(folderRepository);

const createTagController = new CreateTagController(tagRepository);
const getAllTagsController = new GetAllTagsController(tagRepository);
const getTagByIdController = new GetTagByIdController(tagRepository);
const updateTagController = new UpdateTagController(tagRepository);
const deleteTagController = new DeleteTagController(tagRepository);
const searchTagsController = new SearchTagsController(tagRepository);

//=============================
//====MOCK DATA FOR TESTING====
//=============================
const tag1Id = (await createTagController.apply({ name: "tag1" })).tag.id;
const tag2Id = (await createTagController.apply({ name: "tag2" })).tag.id;
const tag3Id = (await createTagController.apply({ name: "tag3" })).tag.id;

const newfolder1 = (await folderRepository.findByName("newfolder1", "user")).at(0)!;
const newfolder2 = (await folderRepository.findByName("newfolder2", "user")).at(0)!;
const newfolder3 = (await folderRepository.findByName("newfolder3", "user")).at(0)!;
const _subfolder1 = (await folderRepository.findByName("subfolder1", "user")).at(0)!;
const _subfolder2 = (await folderRepository.findByName("subfolder2", "user")).at(0)!;
const subfolder3 = (await folderRepository.findByName("subfolder3", "user")).at(0)!;

await createNoteController.apply({
    name: "f1note1",
    content: "content",
    parentFolderId: newfolder1.id,
    tagsIds: [tag1Id, tag2Id, tag3Id],
});
await createNoteController.apply({
    name: "f1note2",
    content: "content",
    parentFolderId: newfolder1.id,
    tagsIds: [tag1Id, tag2Id],
});
await createNoteController.apply({
    name: "f1note3",
    content: "content",
    parentFolderId: newfolder1.id,
    tagsIds: [tag1Id, tag3Id],
});
await createNoteController.apply({
    name: "f2note1",
    content: "content",
    parentFolderId: newfolder2.id,
    tagsIds: [tag2Id, tag3Id],
});
await createNoteController.apply({
    name: "f2note2",
    content: "content",
    parentFolderId: newfolder2.id,
    tagsIds: [tag1Id, tag2Id],
});
await createNoteController.apply({
    name: "f2note3",
    content: "content",
    parentFolderId: newfolder2.id,
    tagsIds: [tag1Id],
});
await createNoteController.apply({
    name: "f3note1",
    content: "content",
    parentFolderId: newfolder3.id,
    tagsIds: [tag2Id],
});
4;
await createNoteController.apply({
    name: "f3note2",
    content: "content",
    parentFolderId: newfolder3.id,
    tagsIds: [tag3Id],
});
await createNoteController.apply({ name: "f3note3", content: "content", parentFolderId: newfolder3.id, tagsIds: [] });
await createNoteController.apply({ name: "sf3note1", content: "content", parentFolderId: subfolder3.id, tagsIds: [] });
await createNoteController.apply({ name: "sf3note2", content: "content", parentFolderId: subfolder3.id, tagsIds: [] });
await createNoteController.apply({ name: "sf3note3", content: "content", parentFolderId: subfolder3.id, tagsIds: [] });

//=====================
//====SETUP ROUTES=====
//=====================
app.use(
    "/api/notes",
    createNoteRoutes(
        createNoteController,
        getAllNotesController,
        getNoteByIdController,
        updateNoteController,
        deleteNoteController,
        searchNotesController,
        getNotesByTagsController,
    ),
);

app.use(
    "/api/folders",
    createFolderRoutes(
        createFolderController,
        getFolderByIdController,
        getAllFoldersController,
        updateFolderController,
        deleteFolderController,
        getFolderContentsController,
        searchFoldersController,
    ),
);

app.use(
    "/api/tags",
    createTagRoutes(
        createTagController,
        getAllTagsController,
        getTagByIdController,
        updateTagController,
        deleteTagController,
        searchTagsController,
    ),
);

app.use(createViewRoutes(__dirname));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
