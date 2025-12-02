// @ts-types="express"
// @ts-types="express-session"
import { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.user_email || !req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}
