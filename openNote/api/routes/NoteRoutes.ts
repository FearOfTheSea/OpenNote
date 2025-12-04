// @ts-types="express"
// @ts-types="express-session"

import { Router } from "express";
import type { Request, Response } from "express";
import { CreateNoteController } from "../../interface/controllers/note/CreateNoteController.ts";
import { DeleteNoteController } from "../../interface/controllers/note/DeleteNoteController.ts";
import { GetAllNotesController } from "../../interface/controllers/note/GetAllNotesController.ts";
import { GetNoteByIdController } from "../../interface/controllers/note/GetNoteByIdController.ts";
import { GetNotesByTagsController } from "../../interface/controllers/note/GetNotesByTagsController.ts";
import { SearchNotesController } from "../../interface/controllers/note/SearchNotesController.ts";
import { UpdateNoteController } from "../../interface/controllers/note/UpdateNoteController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";

export function createNoteRoutes(
  createNoteController: CreateNoteController,
  deleteNoteController: DeleteNoteController,
  getAllNotesController: GetAllNotesController,
  getNoteByIdController: GetNoteByIdController,
  getNotesByTagsController: GetNotesByTagsController,
  searchNotesController: SearchNotesController,
  updateNoteController: UpdateNoteController,
) {
  const router = Router();

  // Create a new note
  router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log(
        `[NoteRoutes] Creating new note: name: ${req.body.name}, content: ${
          req.body.content || ""
        }, parentFolderId: ${req.body.parent_folder_id}`,
      );
      const result = await createNoteController.apply({
        name: req.body.name,
        content: req.body.content || "",
        parentFolderId: req.body.parent_folder_id,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Get notes with optional tag filtering
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log(`[NoteRoutes] Getting all notes from user ${req.session.user_id}`);
      const tagsParam = req.query.tags as string;
      const userId = req.session.user_id;

      if (tagsParam) {
        const tagIds = tagsParam.split(",");
        const result = await getNotesByTagsController.apply({ userId, tagIds: tagIds });
        res.json(result);
      } else {
        const result = await getAllNotesController.apply({ userId });
        res.json(result.notes);
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Search notes
  router.get("/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await searchNotesController.apply({
        keyword: req.query.q as string,
        userId: req.session.user_id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get note by ID
  router.get("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await getNoteByIdController.apply({ id: req.params.id });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update note
  router.put("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await updateNoteController.apply({
        id: req.params.id,
        newName: req.body.name,
        newContent: req.body.content,
        newParentFolderId: req.body.parent_folder_id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete note
  router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await deleteNoteController.apply({ id: req.params.id });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
