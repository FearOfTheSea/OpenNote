// @ts-types="npm:@types/express@4.17.15"
import { Router } from "express";
import type { Request, Response } from "express";
import { CreateTagController } from "../interface/controllers/tag/CreateTagController.ts";
import { DeleteTagController } from "../interface/controllers/tag/DeleteTagController.ts";
import { GetAllTagsController } from "../interface/controllers/tag/GetAllTagsController.ts";
import { GetTagByIdController } from "../interface/controllers/tag/GetTagByIdController.ts";
import { SearchTagsController } from "../interface/controllers/tag/SearchTagsController.ts";
import { UpdateTagController } from "../interface/controllers/tag/UpdateTagController.ts";

export function createTagRoutes(
    createTagController: CreateTagController,
    getAllTagsController: GetAllTagsController,
    getTagByIdController: GetTagByIdController,
    updateTagController: UpdateTagController,
    deleteTagController: DeleteTagController,
    searchTagsController: SearchTagsController,
) {
    const router = Router();

    // Create a new tag
    router.post("/", async (req: Request, res: Response) => {
        try {
            const result = await createTagController.apply({
                name: req.body.name,
            });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    // Get all tags
    router.get("/", async (_req: Request, res: Response) => {
        try {
            const result = await getAllTagsController.apply();
            res.json(result.tags);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Search tags
    router.get("/search", async (req: Request, res: Response) => {
        try {
            const result = await searchTagsController.apply({
                query: req.query.q as string,
            });
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    });

    // Get tag by ID
    router.get("/:id", async (req: Request, res: Response) => {
        try {
            const result = await getTagByIdController.apply({ id: req.params.id });
            res.json(result);
        } catch (error) {
            res.status(404).json({ error: (error as Error).message });
        }
    });

    // Update tag
    router.put("/:id", async (req: Request, res: Response) => {
        try {
            const result = await updateTagController.apply({
                id: req.params.id,
                name: req.body.name,
            });
            res.json(result.tag);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    // Delete tag
    router.delete("/:id", async (req: Request, res: Response) => {
        try {
            await deleteTagController.apply({ id: req.params.id });
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });

    return router;
}
