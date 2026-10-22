import { randomUUID } from "node:crypto";
import {
  ProjectService,
  TaskService,
  type Clock,
  type IdGenerator,
  type Repositories
} from "@forgeboard/domain";
import {
  createInMemoryRepositories
} from "@forgeboard/persistence";
import express from "express";
import { errorHandler, notFoundHandler } from "./http/errors";
import { createProjectsRouter } from "./routes/projects";
import { createTasksRouter } from "./routes/tasks";
import { createUsersRouter } from "./routes/users";

export interface AppOptions {
  repositories?: Repositories;
  now?: Clock;
  generateId?: IdGenerator;
}

const defaultIdGenerator: IdGenerator = (prefix) =>
  `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

export function createApp(options: AppOptions = {}): express.Express {
  const repositories =
    options.repositories ?? createInMemoryRepositories();
  const now = options.now ?? (() => new Date());
  const generateId = options.generateId ?? defaultIdGenerator;

  const projects = new ProjectService(repositories, now, generateId);
  const tasks = new TaskService(repositories, now, generateId);

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", storage: "memory" });
  });

  app.use("/api/users", createUsersRouter(repositories.users));
  app.use(
    "/api/projects",
    createProjectsRouter({
      users: repositories.users,
      projects,
      tasks
    })
  );
  app.use(
    "/api/tasks",
    createTasksRouter({
      users: repositories.users,
      projects,
      tasks
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
