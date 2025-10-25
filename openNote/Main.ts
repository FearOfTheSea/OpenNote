// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { dirname, fromFileUrl, join } from "@std/path";
import { createUnitOfWork, folderRepository, noteRepository, tagRepository } from "./ApplicationContext.ts";

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
import { GetAllTagsController } from "./interface/controllers/tag/GetAllTagsController.ts";

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
const createNoteController = new CreateNoteController(folderRepository, createUnitOfWork);
const getAllNotesController = new GetAllNotesController(noteRepository);
const getNoteByIdController = new GetNoteByIdController(noteRepository);
const updateNoteController = new UpdateNoteController(folderRepository, noteRepository, createUnitOfWork);
const deleteNoteController = new DeleteNoteController(noteRepository);
const searchNotesController = new SearchNotesController(noteRepository);
const getNotesByTagsController = new GetNotesByTagsController(
    noteRepository,
    tagRepository,
);

const createFolderController = new CreateFolderController(folderRepository);
const getFolderByIdController = new GetFolderByIdController(folderRepository);
const getAllFoldersController = new GetAllFoldersController(folderRepository);
const updateFolderController = new UpdateFolderController(folderRepository);
const deleteFolderController = new DeleteFolderController(folderRepository, createUnitOfWork);
const getFolderContentsController = new GetFolderContentsController(
    folderRepository,
    noteRepository,
);
const searchFoldersController = new SearchFoldersController(folderRepository);

const getAllTagsController = new GetAllTagsController(tagRepository);

//===============================
//====MOCKED DATA FOR TESTING====
//===============================
const newfolder1 = (await folderRepository.findByName("newfolder1", "user")).at(
    0,
)!;
const newfolder2 = (await folderRepository.findByName("newfolder2", "user")).at(
    0,
)!;
const newfolder3 = (await folderRepository.findByName("newfolder3", "user")).at(
    0,
)!;
const _subfolder1 = (
    await folderRepository.findByName("subfolder1", "user")
).at(0)!;
const _subfolder2 = (
    await folderRepository.findByName("subfolder2", "user")
).at(0)!;
const subfolder3 = (await folderRepository.findByName("subfolder3", "user")).at(
    0,
)!;

await createNoteController.apply({
    name: "f1note1",
    content: `f1content
    #tag1
    #tag2
    # not a tag`,
    parentFolderId: newfolder1.id,
});
await createNoteController.apply({
    name: "f1note2",
    content: `f2content
    #tag1
    #tag3`,
    parentFolderId: newfolder1.id,
});
await createNoteController.apply({
    name: "f1note3",
    content: `f3content
    #tag2
    #tag3`,
    parentFolderId: newfolder1.id,
});
await createNoteController.apply({
    name: "f2note1",
    content: "content",
    parentFolderId: newfolder2.id,
});
await createNoteController.apply({
    name: "f2note2",
    content: "content",
    parentFolderId: newfolder2.id,
});
await createNoteController.apply({
    name: "f2note3",
    content: "content",
    parentFolderId: newfolder2.id,
});
await createNoteController.apply({
    name: "f3note1",
    content: "content",
    parentFolderId: newfolder3.id,
});
await createNoteController.apply({
    name: "f3note2",
    content: "content",
    parentFolderId: newfolder3.id,
});
await createNoteController.apply({
    name: "f3note3",
    content: "content",
    parentFolderId: newfolder3.id,
});
await createNoteController.apply({
    name: "sf3note1",
    content: `sf3-1content
    #tag2
    #tag1
    #tag4`,
    parentFolderId: subfolder3.id,
});
await createNoteController.apply({
    name: "sf3note2",
    content: `sf3-2content
    #tag2`,
    parentFolderId: subfolder3.id,
});
await createNoteController.apply({
    name: "sf3note3",
    content: "content",
    parentFolderId: subfolder3.id,
});

//=====================
//====SETUP ROUTES=====
//=====================
app.use(
    "/api/notes",
    createNoteRoutes(
        createNoteController,
        deleteNoteController,
        getAllNotesController,
        getNoteByIdController,
        getNotesByTagsController,
        searchNotesController,
        updateNoteController,
    ),
);

app.use(
    "/api/folders",
    createFolderRoutes(
        createFolderController,
        deleteFolderController,
        getAllFoldersController,
        getFolderByIdController,
        getFolderContentsController,
        searchFoldersController,
        updateFolderController,
    ),
);

app.use(
    "/api/tags",
    createTagRoutes(
        getAllTagsController,
    ),
);

app.use("/api/tags", createTagRoutes(getAllTagsController));

app.use(createViewRoutes(__dirname));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
