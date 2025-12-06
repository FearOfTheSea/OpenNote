// @ts-types="express"
// @ts-types="@std/path"

import { dirname, fromFileUrl, join } from "@std/path";
import { RedisStore } from "connect-redis";
import {
  closeRedis,
  initRedis,
  redisClient,
} from "../infrastructure/redis/RedisClient.ts";
import express from "express";
import session from "express-session";

import {
  createUnitOfWork,
  folderRepository,
  jobRepository,
  noteRepository,
  passwordHasher,
  queueService,
  tagRepository,
  userRepository,
} from "./../ApplicationContext.ts";

import { CreateFolderController } from "./../interface/controllers/folder/CreateFolderController.ts";
import { DeleteFolderController } from "./../interface/controllers/folder/DeleteFolderController.ts";
import { GetAllFoldersController } from "./../interface/controllers/folder/GetAllFoldersController.ts";
import { GetFolderByIdController } from "./../interface/controllers/folder/GetFolderByIdController.ts";
import { GetFolderContentsController } from "./../interface/controllers/folder/GetFolderContentsController.ts";
import { SearchFoldersController } from "./../interface/controllers/folder/SearchFoldersController.ts";
import { UpdateFolderController } from "./../interface/controllers/folder/UpdateFolderController.ts";

import { CreateNoteController } from "./../interface/controllers/note/CreateNoteController.ts";
import { DeleteNoteController } from "./../interface/controllers/note/DeleteNoteController.ts";
import { GetAllNotesController } from "./../interface/controllers/note/GetAllNotesController.ts";
import { GetNoteByIdController } from "./../interface/controllers/note/GetNoteByIdController.ts";
import { GetNotesByTagsController } from "./../interface/controllers/note/GetNotesByTagsController.ts";
import { SearchNotesController } from "./../interface/controllers/note/SearchNotesController.ts";
import { UpdateNoteController } from "./../interface/controllers/note/UpdateNoteController.ts";

import { GetAllTagsController } from "./../interface/controllers/tag/GetAllTagsController.ts";

import { createAuthRoutes } from "./routes/AuthRoutes.ts";
import { createBackupRoutes } from "./routes/BackupRoutes.ts";
import { createFolderRoutes } from "./routes/FolderRoutes.ts";
import { createNoteRoutes } from "./routes/NoteRoutes.ts";
import { createTagRoutes } from "./routes/TagRoutes.ts";
import { createViewRoutes } from "./routes/ViewRoutes.ts";
import { createJobRoutes } from "./routes/JobRoutes.ts";

import { SignInController } from "./../interface/controllers/user/SignInController.ts";
import { SignUpController } from "./../interface/controllers/user/SignUpController.ts";

import { CreateBackupController } from "./../interface/controllers/backup/CreateBackupController.ts";
import { ImportBackupController } from "./../interface/controllers/backup/ImportBackupController.ts";
import { GetJobStatusController } from "../interface/controllers/job/GetJobStatusController.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));

export interface ServerOptions {
  seedMockData?: boolean;
}

export async function createServer(options: ServerOptions = {}) {
  const app = express();

  // Simple per-request timing logger
  app.use((req, res, next) => {
    const start = performance.now();
    console.log(`${req.method} ${req.originalUrl}`);
    res.on("finish", () => {
      const ms = performance.now() - start;
      console.log(
        `[PERF] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`
      );
    });

    next();
  });

  // increase payload limit for large backup files
  app.use(express.json({ limit: "50mb" }));
  app.use(express.static(join(__dirname, "interface/web/public")));

  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
  });

  await initRedis();
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: "sess:",
  });

  app.use(
    session({
      store: redisStore,
      secret: Deno.env.get("SESSION_SECRET") || "a-unique-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );

  // Initialize controllers
  const createNoteController = new CreateNoteController(
    folderRepository,
    createUnitOfWork
  );
  const getAllNotesController = new GetAllNotesController(noteRepository);
  const getNoteByIdController = new GetNoteByIdController(noteRepository);
  const updateNoteController = new UpdateNoteController(
    folderRepository,
    noteRepository,
    createUnitOfWork
  );
  const deleteNoteController = new DeleteNoteController(
    noteRepository,
    createUnitOfWork
  );
  const searchNotesController = new SearchNotesController(noteRepository);
  const getNotesByTagsController = new GetNotesByTagsController(
    noteRepository,
    tagRepository
  );

  const createFolderController = new CreateFolderController(folderRepository);
  const getFolderByIdController = new GetFolderByIdController(folderRepository);
  const getAllFoldersController = new GetAllFoldersController(folderRepository);
  const updateFolderController = new UpdateFolderController(
    folderRepository,
    createUnitOfWork
  );
  const deleteFolderController = new DeleteFolderController(
    folderRepository,
    noteRepository,
    createUnitOfWork
  );
  const getFolderContentsController = new GetFolderContentsController(
    folderRepository,
    noteRepository
  );
  const searchFoldersController = new SearchFoldersController(folderRepository);

  const getAllTagsController = new GetAllTagsController(tagRepository);

  const signInController = new SignInController(userRepository);
  const signUpController = new SignUpController(userRepository);

  const createBackupController = new CreateBackupController(
    jobRepository,
    queueService
  );

  const importBackupController = new ImportBackupController(
    jobRepository,
    queueService
  );

  const getJobStatusController = new GetJobStatusController(jobRepository);

  // Seed mock data
  if (options.seedMockData) {
    await seedMockData(
      createFolderController,
      createNoteController,
      signUpController
    );
  }

  // Setup routes
  app.use(
    "/api/notes",
    createNoteRoutes(
      createNoteController,
      deleteNoteController,
      getAllNotesController,
      getNoteByIdController,
      getNotesByTagsController,
      searchNotesController,
      updateNoteController
    )
  );

  app.use(
    "/api/folders",
    createFolderRoutes(
      createFolderController,
      deleteFolderController,
      getAllFoldersController,
      getFolderByIdController,
      getFolderContentsController,
      searchFoldersController,
      updateFolderController
    )
  );

  app.use("/api/tags", createTagRoutes(getAllTagsController));

  app.use(
    "/api/auth",
    createAuthRoutes(signInController, signUpController, passwordHasher)
  );

  app.use(
    "/api/backup",
    createBackupRoutes(createBackupController, importBackupController)
  );

  app.use("/api/jobs", createJobRoutes(getJobStatusController));

  app.use("/", createViewRoutes(__dirname));

  addEventListener("unload", () => {
    closeRedis().catch(console.error);
  });

  return app;
}

async function seedMockData(
  createFolderController: CreateFolderController,
  createNoteController: CreateNoteController,
  signUpController: SignUpController
) {
  const mockUser = await signUpController.apply(
    {
      fullname: Deno.env.get("USER_FULLNAME") || "Duy Nguyen",
      email: Deno.env.get("USER_EMAIL") || "adnope@gmail.com",
      password: Deno.env.get("USER_PASSWORD") || "adnope123",
    },
    passwordHasher
  );
  const mockUserId = mockUser.id;
  const newfolder1 = await createFolderController.apply({
    name: "newfolder1",
    userId: mockUserId,
  });
  const newfolder2 = await createFolderController.apply({
    name: "newfolder2",
    userId: mockUserId,
  });
  const newfolder3 = await createFolderController.apply({
    name: "newfolder3",
    userId: mockUserId,
  });
  const subfolder1 = await createFolderController.apply({
    name: "subfolder1",
    userId: mockUserId,
    parentFolderId: newfolder1.id,
  });
  const subfolder2 = await createFolderController.apply({
    name: "subfolder2",
    userId: mockUserId,
    parentFolderId: newfolder1.id,
  });
  const subfolder3 = await createFolderController.apply({
    name: "subfolder3",
    userId: mockUserId,
    parentFolderId: newfolder1.id,
  });

  if (
    newfolder1 &&
    newfolder2 &&
    newfolder3 &&
    subfolder1 &&
    subfolder2 &&
    subfolder3
  ) {
    await createNoteController.apply({
      name: "f1note1",
      content: `f1content
    #tag1
    #tag2
    # not a tag`,
      parentFolderId: newfolder1.id,
    });
    await createNoteController.apply({
      name: "f1note2",
      content: `f2content
    #tag1
    #tag3`,
      parentFolderId: newfolder1.id,
    });
    await createNoteController.apply({
      name: "f1note3",
      content: `f3content
    #tag2
    #tag3`,
      parentFolderId: newfolder1.id,
    });
    await createNoteController.apply({
      name: "f2note1",
      content: "content",
      parentFolderId: newfolder2.id,
    });
    await createNoteController.apply({
      name: "f2note2",
      content: "content",
      parentFolderId: newfolder2.id,
    });
    await createNoteController.apply({
      name: "f2note3",
      content: "content",
      parentFolderId: newfolder2.id,
    });
    await createNoteController.apply({
      name: "f3note1",
      content: "content",
      parentFolderId: newfolder3.id,
    });
    await createNoteController.apply({
      name: "f3note2",
      content: "content",
      parentFolderId: newfolder3.id,
    });
    await createNoteController.apply({
      name: "f3note3",
      content: "content",
      parentFolderId: newfolder3.id,
    });
    await createNoteController.apply({
      name: "sf3note1",
      content: `sf3-1content
    #tag2
    #tag1
    #tag4`,
      parentFolderId: subfolder3.id,
    });
    await createNoteController.apply({
      name: "sf3note2",
      content: `sf3-2content
    #tag2`,
      parentFolderId: subfolder3.id,
    });
    await createNoteController.apply({
      name: "sf3note3",
      content: "content",
      parentFolderId: subfolder3.id,
    });
  }
}
