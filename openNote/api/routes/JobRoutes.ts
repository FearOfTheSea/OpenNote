import { Router } from "express";
import { GetJobStatusController } from "../../interface/controllers/job/GetJobStatusController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";

export function createJobRoutes(
  getJobStatusController: GetJobStatusController
) {
  const router = Router();

  // GET /api/jobs/:id
  router.get("/:id", requireAuth, (req, res) => {
    return getJobStatusController.apply(req, res);
  });

  return router;
}
