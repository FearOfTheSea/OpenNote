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
import { redisClient } from "../../infrastructure/redis/RedisClient.ts";
import { invalidateGetFolderContentsCache } from "./FolderRoutes.ts";
import { invalidateGetAllTagsCache } from "./TagRoutes.ts";

const ENABLE_NOTES_CACHE = true;
const NOTES_CACHE_TTL = 600;
function getAllNotesCacheKey(userId: string): string {
  return `notes:list:${userId}`;
}
function getNotesByTagIdsCacheKey(userId: string, tagIds: string[]): string {
  // Normalize tag IDs so "a,b" and "b,a" hit the same cache key
  const normalizedTags = [...tagIds].sort().join(",");
  return `notes:list:${userId}:tags:${normalizedTags}`;
}
function getNoteByIdCacheKey(userId: string, noteId: string): string {
  return `notes:${userId}:id:${noteId}`;
}
export async function invalidateGetAllNotesCache(userId: string) {
  const pattern = `notes:list:${userId}`;
  for await (const keys of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    for await (const key of keys) {
      await redisClient.del(key);
    }
  }
}
export async function invalidateGetNotesByTagIdsCache(userId: string) {
  const pattern = `notes:list:${userId}:tags*`;
  for await (const keys of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    for await (const key of keys) {
      await redisClient.del(key);
    }
  }
}
export async function invalidateGetNoteByIdCache(userId: string, noteId: string) {
  await redisClient.del(`notes:${userId}:id:${noteId}`);
}

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

  // Get all notes
  router.get("/", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id as string;
      const tagsParam = req.query.tags as string | undefined;

      // Cache disabled
      if (!ENABLE_NOTES_CACHE) {
        if (!tagsParam) {
          const result = await getAllNotesController.apply({ userId });
          return res.json(result.notes);
        }

        const tagIds = tagsParam.split(",").map((t) => t.trim()).filter((t) => t.length > 0);

        const result = await getNotesByTagsController.apply({ userId, tagIds });
        return res.json(result);
      }

      // Cache enabled
      if (!tagsParam) {
        const redisKey = getAllNotesCacheKey(userId);
        const cachedValue = await redisClient.get(redisKey);

        if (cachedValue) {
          console.log(
            `[CACHE HIT] GET /api/notes/`,
          );
          const notes = JSON.parse(cachedValue);
          return res.json(notes);
        }

        const result = await getAllNotesController.apply({ userId });
        const notes = result.notes;
        await redisClient.setEx(redisKey, NOTES_CACHE_TTL, JSON.stringify(notes));
        return res.json(notes);
      }

      const tagIds = tagsParam.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
      const redisKeyTags = getNotesByTagIdsCacheKey(userId, tagIds);
      const cachedValueTags = await redisClient.get(redisKeyTags);
      if (cachedValueTags) {
        console.log(`[CACHE HIT] GET /api/notes/`);
        const data = JSON.parse(cachedValueTags);
        return res.json(data);
      }
      const result = await getNotesByTagsController.apply({ userId, tagIds });
      await redisClient.setEx(redisKeyTags, NOTES_CACHE_TTL, JSON.stringify(result));
      return res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

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

      const userId = req.session.user_id;
      await invalidateGetAllNotesCache(userId);
      await invalidateGetAllTagsCache(userId);
      await invalidateGetFolderContentsCache(userId, result.note.parentFolderId);
      await redisClient.setEx(
        getNoteByIdCacheKey(userId, result.note.id),
        NOTES_CACHE_TTL,
        JSON.stringify(result.note),
      );

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Search notes
  router.get("/search", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.query.q) {
        return res.redirect(req.baseUrl);
      }
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
      const userId = req.session.user_id;
      const cacheKey = getNoteByIdCacheKey(userId, req.params.id);
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] GET /api/notes/:id`);
        const note = JSON.parse(cached);
        return res.json(note);
      }

      const result = await getNoteByIdController.apply({ id: req.params.id });
      await redisClient.setEx(
        cacheKey,
        NOTES_CACHE_TTL,
        JSON.stringify(result),
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update note
  router.put("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;
      const result = await updateNoteController.apply({
        id: req.params.id,
        newName: req.body.name,
        newContent: req.body.content,
        newParentFolderId: req.body.parent_folder_id,
      });

      await invalidateGetAllNotesCache(userId);
      await invalidateGetNoteByIdCache(userId, result.note.id);
      await invalidateGetAllTagsCache(userId);
      await invalidateGetFolderContentsCache(userId, result.note.parentFolderId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete note
  router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const noteInfo = await getNoteByIdController.apply({ id: req.params.id });
      await deleteNoteController.apply({ id: req.params.id });
      const userId = req.session.user_id;
      await invalidateGetAllNotesCache(userId);
      await invalidateGetFolderContentsCache(userId, noteInfo.parentFolderId);
      await invalidateGetNoteByIdCache(userId, req.params.id);
      await invalidateGetAllTagsCache(userId);

      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
