// @ts-types="express"
// @ts-types="express-session"

import { Request, Response, Router } from "express";
import { join } from "@std/path";
import { requireAuth } from "./middlewares/RequireAuth.ts";

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

  router.get("/me", requireAuth, (req: Request, res: Response) => {
    return res.json({
      loggedIn: true,
      email: req.session.email,
    });
  });

  return router;
}
