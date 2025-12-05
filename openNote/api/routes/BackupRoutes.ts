// // @ts-types="express"
// // @ts-types="express-session"

// import type { Request, Response } from "express";
// import { Router } from "express";
// import { CreateBackupController } from "../../interface/controllers/backup/CreateBackupController.ts";
// import { ImportBackupController } from "../../interface/controllers/backup/ImportBackupController.ts";
// import { requireAuth } from "./middlewares/RequireAuth.ts";

// export function createBackupRoutes(
//   createBackupController: CreateBackupController,
//   importBackupController: ImportBackupController
// ) {
//   const router = Router();

//   // Export backup route
//   router.get("/export", requireAuth, async (req: Request, res: Response) => {
//     try {
//       const userId = req.session.user_id;

//       if (!userId) {
//         res.status(400).json({ error: "Missing user_id in query parameters" });
//         return;
//       }

//       const result = await createBackupController.apply({ userId });

//       // thêm header để trình duyệt nhận diện đây là file download
//       res.setHeader("Content-Type", "application/json");
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename="${result.filename}"`
//       );

//       // trả về nội dung JSON
//       res.send(result.jsonContent);
//     } catch (error) {
//       console.error("[Backup Export Error]:", error);
//       res.status(500).json({ error: (error as Error).message });
//     }
//   });

//   // Import backup route
//   router.post("/import", requireAuth, async (req: Request, res: Response) => {
//     try {
//       const userId = req.session.user_id;
//       const fileContent = req.body;

//       if (!userId) {
//         res.status(400).json({ error: "Missing user_id in query parameters" });
//         return;
//       }

//       if (!fileContent) {
//         res
//           .status(400)
//           .json({ error: "Missing 'fileContent' in request body" });
//         return;
//       }

//       await importBackupController.apply({ userId, fileContent });

//       res.status(200).json({
//         success: true,
//         message: "Backup imported successfully. Data has been restored.",
//       });
//     } catch (error) {
//       console.error("[Backup Import Error]:", error);
//       res.status(500).json({ error: (error as Error).message });
//     }
//   });

//   return router;
// }

// backup routes with queue
// @ts-types="express"
// @ts-types="express-session"

import type { Request, Response } from "express";
import { Router } from "express";
import { CreateBackupController } from "../../interface/controllers/backup/CreateBackupController.ts";
import { ImportBackupController } from "../../interface/controllers/backup/ImportBackupController.ts";
import { requireAuth } from "./middlewares/RequireAuth.ts";
import { redisClient } from "../../infrastructure/redis/RedisClient.ts";
import { invalidateGetAllNotesCache } from "./NoteRoutes.ts";
import { invalidateGetAllTagsCache } from "./TagRoutes.ts";
import { invalidateGetAllFoldersCache } from "./FolderRoutes.ts";

export function createBackupRoutes(
  createBackupController: CreateBackupController,
  importBackupController: ImportBackupController,
) {
  const router = Router();

  // Export backup route
  router.get("/export", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;

      if (!userId) {
        res.status(400).json({ error: "Missing user_id in query parameters" });
        return;
      }

      // [SỬA ĐỔI]: Controller bây giờ đẩy vào Queue và trả về JobID
      // Không còn trả về file content ngay lập tức nữa
      const result = await createBackupController.apply({ userId });

      // Trả về JobID để Frontend bắt đầu polling
      res.status(202).json({
        // 202 Accepted = Đã nhận, đang xử lý
        success: true,
        message: "Export started",
        jobId: result.jobId,
      });
    } catch (error) {
      console.error("[Backup Export Error]:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Import backup route
  router.post("/import", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user_id;
      const fileContent = req.body;

      if (!userId) {
        res.status(400).json({ error: "Missing user_id" });
        return;
      }

      if (!fileContent) {
        res.status(400).json({ error: "Missing 'fileContent'" });
        return;
      }

      // [SỬA ĐỔI]: Đẩy vào Queue và nhận JobID
      const result = await importBackupController.apply({
        userId,
        fileContent,
      });

      await invalidateGetAllNotesCache(userId);
      await invalidateGetAllFoldersCache(userId);
      await invalidateGetAllTagsCache(userId);

      res.status(202).json({
        success: true,
        message: "Backup import queued.",
        jobId: result.jobId,
      });
    } catch (error) {
      console.error("[Backup Import Error]:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
