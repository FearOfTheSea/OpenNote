// @ts-types="npm:@types/express"
import { Router } from "express";
import { HealthController } from "../../interface/controllers/system/HealthController.ts";

export function createHealthRoutes(healthController: HealthController) {
  const router = Router();

  router.get("/live", healthController.getLiveness);

  router.get("/ready", healthController.getReadiness);

  return router;
}
