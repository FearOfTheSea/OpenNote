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
import { waitForDatabase } from "../../infrastructure/db/postgresClient.ts";
import {
  initRedis,
  closeRedis,
} from "../../infrastructure/redis/RedisClient.ts";
import { RetryExecutor } from "../../infrastructure/resilience/RetryExecutor.ts";

config({ export: true });

async function startWorker() {
  console.log("[WORKER] Initializing...");

  await initRedis();
  await waitForDatabase();

  const queueService = new RedisQueueService(
    Number(Deno.env.get("VISIBILITY_TIMEOUT_SEC") || 60)
  );

  const jobRepo = new PostgreJobRepository();
  const createImportUseCase = new ImportBackup(createUnitOfWork);
  const importHandler = new ImportBackupHandler(createImportUseCase);

  const folderRepo = new PostgreFolderRepository();
  const noteRepo = new PostgreNoteRepository();
  const tagRepo = new PostgreTagRepository();
  const createBackupUseCase = new CreateBackup(folderRepo, noteRepo, tagRepo);
  const exportHandler = new CreateBackupHandler(createBackupUseCase);

  const QUEUES = [
    { name: "import_queue", processing: "import_queue:processing" },
    { name: "export_queue", processing: "export_queue:processing" },
  ];

  // startup recovery 1 lần khi khởi động
  console.log("[WORKER] Running startup recovery...");
  for (const q of QUEUES) {
    await queueService.recover(q.name, q.processing);
  }

  console.log(
    "[WORKER] Listening on queues:",
    QUEUES.map((q) => q.name)
  );

  let lastRecoverTime = Date.now();
  const RECOVER_INTERVAL_MS = 5 * 60 * 1000; // 5p

  while (true) {
    let didWork = false;

    if (Date.now() - lastRecoverTime > RECOVER_INTERVAL_MS) {
      console.log("[WORKER] Running periodic maintenance recovery...");
      for (const q of QUEUES) {
        await queueService.recover(q.name, q.processing);
      }
      lastRecoverTime = Date.now();
    }

    for (const q of QUEUES) {
      try {
        const jobContainer = await queueService.dequeueReliable(
          q.name,
          q.processing
        );

        if (jobContainer) {
          didWork = true;
          const { data, raw } = jobContainer;
          const { jobId, userId, type } = data;

          console.log(`[WORKER] Processing ${type} (Job ${jobId})...`);
          await jobRepo.updateStatus(jobId, "PROCESSING");

          try {
            const resultUrl = await RetryExecutor.execute(
              `Process job ${jobId}`,
              async () => {
                if (q.name === "import_queue") {
                  await importHandler.execute(userId, data.jsonContent);
                  return null; // import không có url trả về
                } else if (q.name === "export_queue") {
                  return await exportHandler.execute(userId, jobId);
                }
                return null;
              },
              { maxRetries: 3, initialDelay: 1000, factor: 2 }
            );

            await queueService.acknowledge(q.processing, raw);

            await jobRepo.updateStatus(jobId, "COMPLETED", resultUrl, null);
          } catch (err) {
            console.error(`[WORKER] Job ${jobId} FAILED logic:`, err);

            await queueService.acknowledge(q.processing, raw);

            await jobRepo.updateStatus(
              jobId,
              "FAILED",
              null,
              (err as Error).message
            );
          }
        }
      } catch (err) {
        console.error(`[WORKER] Infrastructure Error on queue ${q.name}:`, err);
        break;
      }

      // throttle giữa các queue để tránh chiếm dụng CPU
      await new Promise((r) => setTimeout(r, 20));
    }

    // nếu không có việc gì làm, nghỉ 1s
    if (!didWork) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// Fallback
addEventListener("unload", () => {
  closeRedis().catch(console.error);
});

startWorker();
