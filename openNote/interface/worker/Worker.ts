import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { RedisQueueService } from "../../infrastructure/queue/RedisQueueService.ts";
import { ImportBackupHandler } from "./ImportBackupHandler.ts";
import { PostgreJobRepository } from "../../infrastructure/repositories/PostgreJobRepository.ts";
import { createUnitOfWork } from "../../ApplicationContext.ts";
import { CreateBackupHandler } from "./CreateBackupHandler.ts";
import { CreateBackup } from "../../application/useCases/backup/CreateBackUp.ts";
import { ImportBackup } from "../../application/useCases/backup/ImportBackUp.ts";
import { PostgreNoteRepository } from "../../infrastructure/repositories/PostgreNoteRepository.ts";
import { PostgreFolderRepository } from "../../infrastructure/repositories/PostgreFolderRepository.ts";
import { PostgreTagRepository } from "../../infrastructure/repositories/PostgreTagRepository.ts";

// Load env
config({ export: true });

async function startWorker() {
  console.log("🚀 WORKER STARTED - Initializing...");

  // 1. Init Infrastructure
  const queueService = new RedisQueueService(
    Deno.env.get("REDIS_HOST") || "localhost",
    Number(Deno.env.get("REDIS_PORT") || 6379),
  );

  const jobRepo = new PostgreJobRepository();

  const createImportUseCase = new ImportBackup(createUnitOfWork);
  // import handler
  const importHandler = new ImportBackupHandler(createImportUseCase);

  // export handler (dùng để test export trực tiếp)
  const folderRepo = new PostgreFolderRepository();
  const noteRepo = new PostgreNoteRepository();
  const tagRepo = new PostgreTagRepository();

  const createBackupUseCase = new CreateBackup(folderRepo, noteRepo, tagRepo);
  const exportHandler = new CreateBackupHandler(createBackupUseCase);

  // định nghĩa tên queue và processing queue cần lắng nghe
  const QUEUES = [
    { name: "import_queue", processing: "import_queue:processing" },
    { name: "export_queue", processing: "export_queue:processing" },
  ];

  // CRASH RECOVERY
  // Trước khi làm việc, kiểm tra xem có job nào của lần chạy trước bị chết giữa chừng không
  // Khôi phục lỗi cho tất cả queue
  for (const q of QUEUES) {
    await queueService.recover(q.name, q.processing);
  }

  console.log(
    "✅ Worker listening on queues:",
    QUEUES.map((q) => q.name),
  );

  // 3. Event Loop
  while (true) {
    let didWork = false;

    for (const q of QUEUES) {
      try {
        // Dequeue tin cậy
        const jobContainer = await queueService.dequeueReliable(
          q.name,
          q.processing,
        );

        if (jobContainer) {
          didWork = true;
          const { data, raw } = jobContainer;
          const { jobId, userId, type } = data; // Payload phải có type

          console.log(`[WORKER] Processing ${type} (Job ${jobId})...`);
          await jobRepo.updateStatus(jobId, "PROCESSING");

          try {
            let resultUrl = null;

            // --- ROUTING LOGIC ---
            if (q.name === "import_queue") {
              // Payload import có thêm jsonContent
              await importHandler.execute(userId, data.jsonContent);
            } else if (q.name === "export_queue") {
              // Export trả về URL file
              resultUrl = await exportHandler.execute(userId, jobId);
            }

            // Success
            await queueService.acknowledge(q.processing, raw);
            await jobRepo.updateStatus(jobId, "COMPLETED", resultUrl, null);
            console.log(`[WORKER] Job ${jobId} COMPLETED`);
          } catch (err) {
            console.error(`[WORKER] Job ${jobId} FAILED:`, err);
            await queueService.acknowledge(q.processing, raw);
            await jobRepo.updateStatus(
              jobId,
              "FAILED",
              null,
              (err as Error).message,
            );
          }
        }
      } catch (err) {
        console.error(`[WORKER] Error on queue ${q.name}:`, err);
      }

      // [FIX]: Worker nghỉ 20ms sau mỗi job để nhường CPU cho Server API
      // Điều này giúp Server API phản hồi nhanh hơn cho user
      // Vì hiện tại cả 2 chạy chung 1 process
      await new Promise((r) => setTimeout(r, 20));
    }

    // Nếu không có việc ở cả 2 queue, nghỉ 1 chút để đỡ tốn CPU
    if (!didWork) {
      await new Promise((r) => setTimeout(r, 1000)); // Sleep 1s
    }
  }
}

startWorker();
