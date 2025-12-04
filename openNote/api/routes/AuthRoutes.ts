// @ts-types="express"
// @ts-types="express-session"

import { Router } from "express";
import type { Request, Response } from "express";
import { SignUpController } from "../../interface/controllers/user/SignUpController.ts";
import { PasswordHasher } from "../../application/ports/IPasswordHasher.ts";
import { SignInController } from "../../interface/controllers/user/SignInController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";

export function createAuthRoutes(
  signInController: SignInController,
  signUpController: SignUpController,
  passwordHasher: PasswordHasher
) {
  const router = Router();

  // Sign up
  router.post("/signup", async (req: Request, res: Response) => {
    try {
      const result = await signUpController.apply(
        {
          fullname: req.body.fullname,
          email: req.body.email,
          password: req.body.password,
        },
        passwordHasher
      );

      console.log("[AuthRoutes] Created user with id:", result.id);

      res.status(201).json({
        user_id: result.id,
        email: result.email,
        fullname: result.fullName,
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Sign in
  router.post("/signin", async (req: Request, res: Response) => {
    try {
      const signInResult = await signInController.apply(
        {
          email: req.body.email,
          password: req.body.password,
        },
        passwordHasher
      );

      const userId = signInResult.userId;
      const userEmail = signInResult.userEmail;
      req.session.regenerate((err: Error) => {
        if (err) {
          console.error("Session regenerate error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Store whatever you need to identify the user
        req.session.user_id = userId;
        req.session.user_email = userEmail;

        console.log(`[AuthRoutes] User with email ${userEmail} logged in!`);

        // Ensure the session is saved before responding
        req.session.save((err: Error) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ error: "Internal server error" });
          }
          return res.status(200).json({
            user_id: req.session.user_id,
            user_email: req.session.user_email,
          });
        });
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Sign out
  router.post("/signout", requireAuth, (req: Request, res: Response) => {
    const userEmail = req.session.user_email;
    req.session.destroy((err: Error) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      console.log(`[AuthRoutes] User with email ${userEmail} logged out!`);
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  return router;
}
