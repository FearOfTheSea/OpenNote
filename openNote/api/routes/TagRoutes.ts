// @ts-types="express"
// @ts-types="express-session"

import { Router } from "express";
import type { Request, Response } from "express";
import { GetAllTagsController } from "../../interface/controllers/tag/GetAllTagsController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";

export function createTagRoutes(
  getAllTagsController: GetAllTagsController,
) {
  const router = Router();

  // Get all tags
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await getAllTagsController.apply({ userId: req.session.user_id });
      res.json(result.tags);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
