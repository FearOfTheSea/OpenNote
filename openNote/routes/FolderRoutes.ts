// @ts-types="npm:@types/express@4.17.15"
import { Router } from "express";
import type { Request, Response } from "express";
import { CreateFolderController } from "../interface/controllers/folder/CreateFolderController.ts";
import { GetFolderByIdController } from "../interface/controllers/folder/GetFolderByIdController.ts";
import { GetAllFoldersController } from "../interface/controllers/folder/GetAllFoldersController.ts";
import { DeleteFolderController } from "../interface/controllers/folder/DeleteFolderController.ts";
import { GetFolderContentsController } from "../interface/controllers/folder/GetFolderContentsController.ts";
import { SearchFoldersController } from "../interface/controllers/folder/SearchFoldersController.ts";
import { UpdateFolderController } from "../interface/controllers/folder/UpdateFolderController.ts";

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
    router.post("/", async (req: Request, res: Response) => {
        try {
            const result = await createFolderController.apply({
                name: req.body.name,
                userId: req.body.user_id,
                parentFolderId: req.body.parent_folder_id,
            });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    // Search folders
    router.get("/search", async (req: Request, res: Response) => {
        try {
            const result = await searchFoldersController.apply({
                keyword: req.query.q as string,
                userId: req.query.user_id as string,
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Get all folders
    router.get("/", async (req: Request, res: Response) => {
        try {
            const userId = req.query.user_id as string;
            const result = await getAllFoldersController.apply({ userId });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Get folder by ID
    router.get("/:id", async (req: Request, res: Response) => {
        try {
            const result = await getFolderByIdController.apply({ id: req.params.id });
            res.json(result);
        } catch (error) {
            res.status(404).json({ error: (error as Error).message });
        }
    });

    // Get folder contents (subfolders and notes)
    router.get("/:id/contents", async (req: Request, res: Response) => {
        try {
            const result = await getFolderContentsController.apply({
                userId: req.query.user_id as string,
                folderId: req.params.id,
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Update folder
    router.put("/:id", async (req: Request, res: Response) => {
        try {
            const result = await updateFolderController.apply({
                id: req.params.id,
                newName: req.body.name,
                newParentFolderId: req.body.parentFolderId,
            });
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    // Delete folder
    router.delete("/:id", async (req: Request, res: Response) => {
        try {
            await deleteFolderController.apply({ id: req.params.id });
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    return router;
}
