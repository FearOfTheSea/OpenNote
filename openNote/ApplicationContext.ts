import { NoteRepository } from "./application/repositories/NoteRepository.ts";
import { FolderRepository } from "./application/repositories/FolderRepository.ts";
import { TagRepository } from "./application/repositories/TagRepository.ts";
import { InMemoryNoteRepository } from "./infrastructure/repositories/InMemoryNoteRepository.ts";
import { InMemoryFolderRepository } from "./infrastructure/repositories/InMemoryFolderRepository.ts";
import { InMemoryTagRepository } from "./infrastructure/repositories/InMemoryTagRepository.ts";
import { InMemoryUnitOfWork } from "./infrastructure/repositories/InMemoryUnitOfWork.ts";
import type { IUnitOfWork } from "./application/ports/IUnitOfWork.ts";
import { PostgreNoteRepository } from "./infrastructure/repositories/PostgreNoteRepository.ts";
import { PostgreFolderRepository } from "./infrastructure/repositories/PostgreFolderRepository.ts";
import { PostgreTagRepository } from "./infrastructure/repositories/PostgreTagRepository.ts";
import { PostgreUnitOfWork } from "./infrastructure/db/PostgreUnitOfWork.ts";
import { PostgreUserRepository } from "./infrastructure/repositories/PostgreUserRepository.ts";
import { UserRepository } from "./application/repositories/UserRepository.ts";
import { InMemoryUserRepository } from "./infrastructure/repositories/InmemoryUserRepository.ts";
import { BcryptPasswordHasher } from "./infrastructure/utils/BcryptPasswordHasher.ts";
import { closeDbPool, getPool } from "./infrastructure/db/postgresClient.ts";
import { JobRepository } from "./application/repositories/JobRepository.ts";
import { PostgreJobRepository } from "./infrastructure/repositories/PostgreJobRepository.ts";
import { IQueueService } from "./application/ports/IQueueService.ts";
import { RedisQueueService } from "./infrastructure/queue/RedisQueueService.ts";

const env = Deno.env.get("NODE_ENV") || "development";

let noteRepository: NoteRepository;
let folderRepository: FolderRepository;
let tagRepository: TagRepository;
let userRepository: UserRepository;
let jobRepository: JobRepository;
let queueService: IQueueService;

let createUnitOfWork: () => Promise<IUnitOfWork>;

switch (env) {
  case "test": {
    folderRepository = new InMemoryFolderRepository();
    noteRepository = new InMemoryNoteRepository(folderRepository);
    tagRepository = new InMemoryTagRepository(noteRepository, folderRepository);
    createUnitOfWork = () => {
      return Promise.resolve(
        new InMemoryUnitOfWork(noteRepository, tagRepository, folderRepository)
      );
    };
    console.log("[CONTEXT]: test");
    break;
  }

  case "production": {
    folderRepository = new PostgreFolderRepository();
    noteRepository = new PostgreNoteRepository();
    tagRepository = new PostgreTagRepository();
    userRepository = new PostgreUserRepository();
    jobRepository = new PostgreJobRepository();

    queueService = new RedisQueueService(60);

    createUnitOfWork = async () => {
      try {
        const pool = await getPool();
        const client = await pool.connect();

        await client.queryObject("SELECT 1");

        const tx = client.createTransaction("unit_of_work_tx");

        const noteRepo = new PostgreNoteRepository(tx);
        const folderRepo = new PostgreFolderRepository(tx);
        const tagRepo = new PostgreTagRepository(tx);

        return new PostgreUnitOfWork(tx, client, noteRepo, tagRepo, folderRepo);
      } catch (error) {
        await closeDbPool(); // pool được gán null để tạo lại
        throw error;
      }
    };

    console.log("[CONTEXT]: production");
    break;
  }

  case "development":
  default: {
    folderRepository = new InMemoryFolderRepository();
    noteRepository = new InMemoryNoteRepository(folderRepository);
    tagRepository = new InMemoryTagRepository(noteRepository, folderRepository);
    userRepository = new InMemoryUserRepository();
    createUnitOfWork = () => {
      return Promise.resolve(
        new InMemoryUnitOfWork(noteRepository, tagRepository, folderRepository)
      );
    };
    console.log("[CONTEXT]: development");
    break;
  }
}

const passwordHasher = new BcryptPasswordHasher();

export {
  createUnitOfWork,
  folderRepository,
  jobRepository,
  noteRepository,
  passwordHasher,
  queueService,
  tagRepository,
  userRepository,
};
