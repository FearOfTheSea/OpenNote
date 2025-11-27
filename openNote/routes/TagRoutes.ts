// @ts-types="npm:@types/express@4.17.15"
import { Router } from "express";
import type { Request, Response } from "express";
import { GetAllTagsController } from "../interface/controllers/tag/GetAllTagsController.ts";

export function createTagRoutes(
  getAllTagsController: GetAllTagsController,
) {
  const router = Router();

  // Get all tags
  router.get("/", async (req: Request, res: Response) => {
    try {
      const result = await getAllTagsController.apply({ userId: req.query.user_id as string });
      res.json(result.tags);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
