// @ts-types="express"
// @ts-types="express-session"
import type { Request, Response } from "express";
import { Router } from "express";
import { CreateFolderController } from "../../interface/controllers/folder/CreateFolderController.ts";
import { DeleteFolderController } from "../../interface/controllers/folder/DeleteFolderController.ts";
import { GetAllFoldersController } from "../../interface/controllers/folder/GetAllFoldersController.ts";
import { GetFolderByIdController } from "../../interface/controllers/folder/GetFolderByIdController.ts";
import { GetFolderContentsController } from "../../interface/controllers/folder/GetFolderContentsController.ts";
import { SearchFoldersController } from "../../interface/controllers/folder/SearchFoldersController.ts";
import { UpdateFolderController } from "../../interface/controllers/folder/UpdateFolderController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";

export function createFolderRoutes(
  createFolderController: CreateFolderController,
  deleteFolderController: DeleteFolderController,
  getAllFoldersController: GetAllFoldersController,
  getFolderByIdController: GetFolderByIdController,
  getFolderContentsController: GetFolderContentsController,
  searchFoldersController: SearchFoldersController,
  updateFolderController: UpdateFolderController,
) {
  const router = Router();

  // Create a new folder
  router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await createFolderController.apply({
        name: req.body.name,
        userId: req.session.user_id,
        parentFolderId: req.body.parent_folder_id,
      });

      console.log("[FolderRoutes] Create folder: User id: ", req.body.user_id);

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Search folders
  router.get("/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await searchFoldersController.apply({
        keyword: req.query.q as string,
        userId: req.session.user_id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all folders
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log(`[FolderRoutes] Getting all folders from user ${req.query.user_id}`);

      const userId = req.session.user_id;
      const result = await getAllFoldersController.apply({ userId });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get folder by ID
  router.get("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await getFolderByIdController.apply({ id: req.params.id });
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  // Get folder contents (subfolders and notes)
  router.get("/:id/contents", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log(`[FolderRoutes] Getting a folder's content from user ${req.session.user_id}`);
      const result = await getFolderContentsController.apply({
        userId: req.session.user_id,
        folderId: req.params.id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update folder
  router.put("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await updateFolderController.apply({
        id: req.params.id,
        newName: req.body.name,
        newParentFolderId: req.body.parent_folder_id,
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Delete folder
  router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await deleteFolderController.apply({ id: req.params.id });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
