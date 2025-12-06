// @ts-types="express"
// @ts-types="express-session"

import { Router } from "express";
import type { Request, Response } from "express";
import { GetAllTagsController } from "../../interface/controllers/tag/GetAllTagsController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";
import { redisClient } from "../../infrastructure/redis/RedisClient.ts";

const NOTES_CACHE_TTL = 600;
function getAllTagsCacheKey(userId: string): string {
  return `tags:list:${userId}`;
}
export async function invalidateGetAllTagsCache(userId: string) {
  await redisClient.del(`tags:list:${userId}`);
}

export function createTagRoutes(
  getAllTagsController: GetAllTagsController,
) {
  const router = Router();

  // Get all tags
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      // const userId = req.session.user_id;

      // const cacheKey = getAllTagsCacheKey(userId);
      // const cached = await redisClient.get(cacheKey);

      // if (cached) {
      //   console.log(`[CACHE HIT] GET /api/tags`);
      //   const data = JSON.parse(cached);
      //   return res.json(data);
      // }

      const result = await getAllTagsController.apply({ userId: req.session.user_id });
      // await redisClient.setEx(cacheKey, NOTES_CACHE_TTL, JSON.stringify(result));
      res.json(result.tags);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
