// @ts-types="npm:@types/express@4.17.15"
import { Router } from "express";
import type { Request, Response } from "express";
import { join } from "@std/path";

export function createViewRoutes(dirname: string) {
  const router = Router();

  // Homepage
  router.get("/", (_req: Request, res: Response) => {
    res.sendFile(join(dirname, "interface/web/views/homepage.html"));
  });

  // Note editor for existing note
  router.get("/note/:id", (_req: Request, res: Response) => {
    res.sendFile(join(dirname, "interface/web/views/editor.html"));
  });

  // Note editor for new note
  router.get("/note/new", (_req: Request, res: Response) => {
    res.sendFile(join(dirname, "interface/web/views/editor.html"));
  });

  return router;
}
