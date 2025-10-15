// @ts-types="npm:@types/express@4.17.15"
import express from "express";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.214.0/path/mod.ts";
import { folderRepository, noteRepository, tagRepository } from "./ApplicationContext.ts";
import { CreateNoteController } from "./interface/controllers/note/CreateNoteController.ts";
import { GetAllNotesController } from "./interface/controllers/note/GetAllNotesController.ts";
import { GetNoteByIdController } from "./interface/controllers/note/GetNoteByIdController.ts";
import { UpdateNoteController } from "./interface/controllers/note/UpdateNoteController.ts";
import { DeleteNoteController } from "./interface/controllers/note/DeleteNoteController.ts";
import { SearchNotesController } from "./interface/controllers/note/SearchNotesController.ts";
import { GetNotesByTagsController } from "./interface/controllers/note/GetNotesByTagsController.ts";
import { CreateFolderController } from "./interface/controllers/folder/CreateFolderController.ts";
import { GetFolderByIdController } from "./interface/controllers/folder/GetFolderByIdController.ts";
import { GetAllFoldersController } from "./interface/controllers/folder/GetAllFoldersController.ts";
import { UpdateFolderController } from "./interface/controllers/folder/UpdateFolderController.ts";
import { DeleteFolderController } from "./interface/controllers/folder/DeleteFolderController.ts";
import { GetFolderContentsController } from "./interface/controllers/folder/GetFolderContentsController.ts";
import { CreateTagController } from "./interface/controllers/tag/CreateTagController.ts";
import { GetAllTagsController } from "./interface/controllers/tag/GetAllTagsController.ts";
import { GetTagByIdController } from "./interface/controllers/tag/GetTagByIdController.ts";
import { UpdateTagController } from "./interface/controllers/tag/UpdateTagController.ts";
import { DeleteTagController } from "./interface/controllers/tag/DeleteTagController.ts";
import { SearchTagsController } from "./interface/controllers/tag/SearchTagsController.ts";
import { SearchFoldersController } from "./interface/controllers/folder/SearchFoldersController.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "interface/web/public")));

const port = 3000;

// CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

// NOTE ENDPOINTS
const createNoteController = new CreateNoteController(noteRepository, folderRepository, tagRepository);
const getAllNotesController = new GetAllNotesController(noteRepository);
const getNoteByIdController = new GetNoteByIdController(noteRepository);
const updateNoteController = new UpdateNoteController(noteRepository, folderRepository, tagRepository);
const deleteNoteController = new DeleteNoteController(noteRepository);
const searchNotesController = new SearchNotesController(noteRepository);
const getNotesByTagsController = new GetNotesByTagsController(noteRepository, tagRepository);

const newfolder1 = (await folderRepository.searchByKeyword("newfolder1", null)).at(0);
const newfolder2 = (await folderRepository.searchByKeyword("newfolder2", null)).at(0);
const newfolder3 = (await folderRepository.searchByKeyword("newfolder3", null)).at(0);
const subfolder1 = (await folderRepository.searchByKeyword("subfolder1", null)).at(0);
const subfolder2 = (await folderRepository.searchByKeyword("subfolder2", null)).at(0);
const subfolder3 = (await folderRepository.searchByKeyword("subfolder3", null)).at(0);

await createNoteController.apply({ name: "f1note1", content: "content", folderId: newfolder1.id, tagsId: [] });
await createNoteController.apply({ name: "f1note2", content: "content", folderId: newfolder1.id, tagsId: [] });
await createNoteController.apply({ name: "f1note3", content: "content", folderId: newfolder1.id, tagsId: [] });
await createNoteController.apply({ name: "f2note1", content: "content", folderId: newfolder2.id, tagsId: [] });
await createNoteController.apply({ name: "f2note2", content: "content", folderId: newfolder2.id, tagsId: [] });
await createNoteController.apply({ name: "f2note3", content: "content", folderId: newfolder2.id, tagsId: [] });
await createNoteController.apply({ name: "f3note1", content: "content", folderId: newfolder3.id, tagsId: [] });
await createNoteController.apply({ name: "f3note2", content: "content", folderId: newfolder3.id, tagsId: [] });
await createNoteController.apply({ name: "f3note3", content: "content", folderId: newfolder3.id, tagsId: [] });
await createNoteController.apply({ name: "sf3note1", content: "content", folderId: subfolder3.id, tagsId: [] });
await createNoteController.apply({ name: "sf3note2", content: "content", folderId: subfolder3.id, tagsId: [] });
await createNoteController.apply({ name: "sf3note3", content: "content", folderId: subfolder3.id, tagsId: [] });

// Create a new note
app.post("/api/notes", async (req, res) => {
    try {
        const result = await createNoteController.apply({
            name: req.body.name,
            content: req.body.content,
            folderId: req.body.folderId,
            tagsId: req.body.tagsId,
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get notes by tags
app.get("/api/notes", async (req, res) => {
    try {
        const tagsParam = req.query.tags as string;

        if (tagsParam) {
            // Filter by tags
            const tagsId = tagsParam.split(",");
            const result = await getNotesByTagsController.apply({ tagsId });
            res.json(result);
        } else {
            // Return all notes
            const allNotes = await noteRepository.findAll();
            res.json(allNotes);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all notes
app.get("/api/notes", async (req, res) => {
    try {
        const result = await getAllNotesController.apply();
        res.json(result.notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search notes
app.get("/api/notes/search", async (req, res) => {
    try {
        const result = await searchNotesController.apply({
            query: req.query.q as string,
            folderId: req.query.folderId as string,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get note by ID
app.get("/api/notes/:id", async (req, res) => {
    try {
        const result = await getNoteByIdController.apply({ id: req.params.id });
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Update note
app.put("/api/notes/:id", async (req, res) => {
    try {
        const result = await updateNoteController.apply({
            id: req.params.id,
            name: req.body.name,
            content: req.body.content,
            folderId: req.body.folderId,
            tagsId: req.body.tagsId,
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete note
app.delete("/api/notes/:id", async (req, res) => {
    try {
        await deleteNoteController.apply({ id: req.params.id });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get notes by folder ID
app.get("/api/folders/:folderId/notes", async (req, res) => {
    try {
        const notes = await noteRepository.findByFolderId(req.params.folderId);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// FOLDER ENDPOINTS
const createFolderController = new CreateFolderController(folderRepository);
const getFolderByIdController = new GetFolderByIdController(folderRepository);
const getAllFoldersController = new GetAllFoldersController(folderRepository);
const updateFolderController = new UpdateFolderController(folderRepository);
const deleteFolderController = new DeleteFolderController(folderRepository);
const getFolderContentsController = new GetFolderContentsController(
    folderRepository,
    noteRepository,
);
const searchFoldersController = new SearchFoldersController(folderRepository);

// Create a new folder
app.post("/api/folders", async (req, res) => {
    try {
        const result = await createFolderController.apply({
            name: req.body.name,
            parentFolderId: req.body.parentFolderId,
            userId: req.body.userId,
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Search folders
app.get("/api/folders/search", async (req, res) => {
    try {
        const result = await searchFoldersController.apply({
            query: req.query.q as string,
            parentFolderId: req.query.parentFolderId as string | undefined,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all folders
app.get("/api/folders", async (req, res) => {
    try {
        const result = await getAllFoldersController.apply();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get folder by ID
app.get("/api/folders/:id", async (req, res) => {
    try {
        const result = await getFolderByIdController.apply({ id: req.params.id });
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Get folder contents (subfolders and notes)
app.get("/api/folders/:id/contents", async (req, res) => {
    try {
        const result = await getFolderContentsController.apply({
            folderId: req.params.id,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update folder
app.put("/api/folders/:id", async (req, res) => {
    try {
        const result = await updateFolderController.apply({
            id: req.params.id,
            name: req.body.name,
            parentFolderId: req.body.folderId,
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete folder
app.delete("/api/folders/:id", async (req, res) => {
    try {
        await deleteFolderController.apply({ id: req.params.id });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// TAG ENDPOINTS
const createTagController = new CreateTagController(tagRepository);
const getAllTagsController = new GetAllTagsController(tagRepository);
const getTagByIdController = new GetTagByIdController(tagRepository);
const updateTagController = new UpdateTagController(tagRepository);
const deleteTagController = new DeleteTagController(tagRepository);
const searchTagsController = new SearchTagsController(tagRepository);

// Create a new tag
app.post("/api/tags", async (req, res) => {
    try {
        const result = await createTagController.apply({
            name: req.body.name,
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all tags
app.get("/api/tags", async (req, res) => {
    try {
        const result = await getAllTagsController.apply();
        res.json(result.tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search tags
app.get("/api/tags/search", async (req, res) => {
    try {
        const result = await searchTagsController.apply({
            query: req.query.q as string,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get tag by ID
app.get("/api/tags/:id", async (req, res) => {
    try {
        const result = await getTagByIdController.apply({ id: req.params.id });
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Update tag
app.put("/api/tags/:id", async (req, res) => {
    try {
        const result = await updateTagController.apply({
            id: req.params.id,
            name: req.body.name,
        });
        res.json(result.tag);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete tag
app.delete("/api/tags/:id", async (req, res) => {
    try {
        await deleteTagController.apply({ id: req.params.id });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "interface/web/views/homepage.html"));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
