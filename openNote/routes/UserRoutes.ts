// @ts-types="express"
import { Router } from "express";
import type { Request, Response } from "express";
import { SignUpController } from "../interface/controllers/user/SignUpController.ts";
import { PasswordHasher } from "../application/useCases/utils.ts";
import { SignInController } from "../interface/controllers/user/SignInController.ts";

export function createUserRoutes(
  signInController: SignInController,
  signUpController: SignUpController,
  passwordHasher: PasswordHasher,
) {
  const router = Router();

  // Sign up
  router.post("/signup", async (req: Request, res: Response) => {
    try {
      const result = await signUpController.apply({
        fullname: req.body.fullname,
        email: req.body.email,
        password: req.body.password,
      }, passwordHasher);

      console.log("[UserRoutes] Created user with id:", result.id);

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Sign in
  router.post("/signin", async (req: Request, res: Response) => {
    try {
      await signInController.apply({
        email: req.body.email,
        password: req.body.password,
      }, passwordHasher);

      console.log(`[UserRoutes] User with email ${req.body.email} logged in!`);
      return res.status(200).json();
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
