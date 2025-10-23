// @ts-types="npm:@types/express@4.17.15"
import { Router } from "express";
import type { Request, Response } from "express";
import { CreateNoteController } from "../interface/controllers/note/CreateNoteController.ts";
import { DeleteNoteController } from "../interface/controllers/note/DeleteNoteController.ts";
import { GetAllNotesController } from "../interface/controllers/note/GetAllNotesController.ts";
import { GetNoteByIdController } from "../interface/controllers/note/GetNoteByIdController.ts";
import { GetNotesByTagsController } from "../interface/controllers/note/GetNotesByTagsController.ts";
import { SearchNotesController } from "../interface/controllers/note/SearchNotesController.ts";
import { UpdateNoteController } from "../interface/controllers/note/UpdateNoteController.ts";

export function createNoteRoutes(
    createNoteController: CreateNoteController,
    getAllNotesController: GetAllNotesController,
    getNoteByIdController: GetNoteByIdController,
    updateNoteController: UpdateNoteController,
    deleteNoteController: DeleteNoteController,
    searchNotesController: SearchNotesController,
    getNotesByTagsController: GetNotesByTagsController,
) {
    const router = Router();

    // Create a new note
    router.post("/", async (req: Request, res: Response) => {
        try {
            const result = await createNoteController.apply({
                name: req.body.name,
                content: req.body.content,
                folderId: req.body.folderId,
                tagsId: req.body.tagsId,
            });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    // Get notes with optional tag filtering
    router.get("/", async (req: Request, res: Response) => {
        try {
            const tagsParam = req.query.tags as string;

            if (tagsParam) {
                const tagsId = tagsParam.split(",");
                const result = await getNotesByTagsController.apply({ tagsId });
                res.json(result);
            } else {
                const result = await getAllNotesController.apply();
                res.json(result.notes);
            }
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Search notes
    router.get("/search", async (req: Request, res: Response) => {
        try {
            const result = await searchNotesController.apply({
                query: req.query.q as string,
                folderId: req.query.folderId as string,
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Get note by ID
    router.get("/:id", async (req: Request, res: Response) => {
        try {
            const result = await getNoteByIdController.apply({ id: req.params.id });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Update note
    router.put("/:id", async (req: Request, res: Response) => {
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
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Delete note
    router.delete("/:id", async (req: Request, res: Response) => {
        try {
            await deleteNoteController.apply({ id: req.params.id });
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    return router;
}
