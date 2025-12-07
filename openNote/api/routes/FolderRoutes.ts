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
import { redisClient } from "../../infrastructure/redis/RedisClient.ts";
import {
  invalidateGetAllNotesCache,
  invalidateGetNoteByIdCache,
  invalidateGetNotesByTagIdsCache,
} from "./NoteRoutes.ts";
import { invalidateGetAllTagsCache } from "./TagRoutes.ts";

const NOTES_CACHE_TTL = 600;
function getAllFoldersCacheKey(userId: string): string {
  return `folders:list:${userId}`;
}
function getFolderByIdCacheKey(userId: string, folderId: string): string {
  return `folders:${userId}:id:${folderId}`;
}
function getFolderContentsCacheKey(userId: string, folderId: string): string {
  return `folders:${userId}:id:${folderId}:contents`;
}
export async function invalidateGetAllFoldersCache(userId: string) {
  await redisClient.del(`folders:list:${userId}`);
}
export async function invalidateGetFolderByIdCache(userId: string, folderId: string) {
  await redisClient.del(`folders:${userId}:id:${folderId}`);
}
export async function invalidateGetFolderContentsCache(userId: string, folderId: string) {
  await redisClient.del(`folders:${userId}:id:${folderId}:contents`);
}

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

  // Get all folders
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;

      const cacheKey = getAllFoldersCacheKey(userId);
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        console.log(`[CACHE HIT] GET /api/folders`);
        const data = JSON.parse(cached);
        return res.json(data);
      }

      const result = await getAllFoldersController.apply({ userId });
      await redisClient.setEx(cacheKey, NOTES_CACHE_TTL, JSON.stringify(result));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create a new folder
  router.post("/", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;
      const result = await createFolderController.apply({
        name: req.body.name,
        userId: userId,
        parentFolderId: req.body.parent_folder_id,
      });

      // console.log("[FolderRoutes] Create folder: User id: ", req.body.user_id);
      await invalidateGetAllFoldersCache(userId);
      if (result.parentFolderId) {
        await invalidateGetFolderContentsCache(userId, req.body.parent_folder_id);
        await invalidateGetFolderByIdCache(userId, result.parentFolderId);
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Search folders
  router.get("/search", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.query.q) {
        return res.redirect(req.baseUrl);
      }
      const result = await searchFoldersController.apply({
        keyword: req.query.q as string,
        userId: req.session.user_id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get folder by ID
  router.get("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;

      const cacheKey = getFolderByIdCacheKey(userId, req.params.id);
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] GET /api/folders/:id`);
        const data = JSON.parse(cached);
        return res.json(data);
      }

      const result = await getFolderByIdController.apply({ id: req.params.id });
      await redisClient.setEx(cacheKey, NOTES_CACHE_TTL, JSON.stringify(result));
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });
  // Get folder contents (subfolders and notes)
  router.get("/:id/contents", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;
      const cacheKey = getFolderContentsCacheKey(userId, req.params.id);
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] GET /api/folders/:id/contents`);
        const data = JSON.parse(cached);
        return res.json(data);
      }

      const result = await getFolderContentsController.apply({
        userId: req.session.user_id,
        folderId: req.params.id,
      });
      await redisClient.setEx(cacheKey, NOTES_CACHE_TTL, JSON.stringify(result));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update folder
  router.put("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;
      const result = await updateFolderController.apply({
        id: req.params.id,
        newName: req.body.name,
        newParentFolderId: req.body.parent_folder_id,
      });

      await invalidateGetAllFoldersCache(userId);
      if (result.folder.parentFolderId) {
        await invalidateGetFolderContentsCache(userId, result.folder.parentFolderId);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Delete folder
  router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;
      const contents = await getFolderContentsController.apply({ userId: userId, folderId: req.params.id });
      for (const folder of contents.folders) {
        await invalidateGetFolderByIdCache(userId, folder.id);
        await invalidateGetFolderContentsCache(userId, folder.id);
      }
      for (const note of contents.notes) {
        await invalidateGetNoteByIdCache(userId, note.id);
      }
      await invalidateGetAllNotesCache(userId);
      await invalidateGetNotesByTagIdsCache(userId);
      await invalidateGetAllFoldersCache(userId);
      await invalidateGetAllTagsCache(userId);

      const parentFolderId = (await getFolderByIdController.apply({ id: req.params.id })).parentFolderId;
      if (parentFolderId) {
        await invalidateGetFolderByIdCache(userId, parentFolderId);
      }
      await invalidateGetFolderByIdCache(userId, req.params.id);
      await deleteFolderController.apply({ id: req.params.id });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
