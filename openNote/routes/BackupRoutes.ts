import { Router } from "express";
import type { Request, Response } from "express";
import { CreateBackupController } from "../interface/controllers/backup/CreateBackupController.ts";
import { ImportBackupController } from "../interface/controllers/backup/ImportBackupController.ts";

export function createBackupRoutes(
  createBackupController: CreateBackupController,
  importBackupController: ImportBackupController
) {
  const router = Router();

  // Export backup route
  router.get("/export", async (req: Request, res: Response) => {
    try {
      // t lấy userId từ query parameters giống ở các route khác
      // chắc m dùng session sẽ thay sau
      const userId = req.query.user_id as string;

      if (!userId) {
        res.status(400).json({ error: "Missing user_id in query parameters" });
        return;
      }

      const result = await createBackupController.apply({ userId });

      // thêm header để trình duyệt nhận diện đây là file download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.filename}"`
      );

      // trả về nội dung JSON
      res.send(result.jsonContent);
    } catch (error) {
      console.error("[Backup Export Error]:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Import backup route
  router.post("/import", async (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id as string;
      const { fileContent } = req.body;

      if (!userId) {
        res.status(400).json({ error: "Missing user_id in query parameters" });
        return;
      }

      if (!fileContent) {
        res
          .status(400)
          .json({ error: "Missing 'fileContent' in request body" });
        return;
      }

      await importBackupController.apply({ userId, fileContent });

      res.status(200).json({
        success: true,
        message: "Backup imported successfully. Data has been restored.",
      });
    } catch (error) {
      console.error("[Backup Import Error]:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
