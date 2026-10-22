import type {
  ProjectService,
  TaskService,
  UserRepository
} from "@forgeboard/domain";
import { Router } from "express";
import { getActorId, requireActor } from "../http/actor";
import { toProjectDetailDto } from "../http/presenters";
import { parseTaskStatusBody } from "../http/validation";

interface TaskRouteDependencies {
  users: UserRepository;
  projects: ProjectService;
  tasks: TaskService;
}

export function createTasksRouter(dependencies: TaskRouteDependencies): Router {
  const router = Router();
  router.use(requireActor(dependencies.users));

  router.patch("/:taskId", (req, res) => {
    const actorId = getActorId(res);
    const nextStatus = parseTaskStatusBody(req.body);
    const task = dependencies.tasks.updateTaskStatus(
      req.params.taskId,
      actorId,
      nextStatus
    );
    const project = dependencies.projects.getProject(task.projectId, actorId);
    res.json({ project: toProjectDetailDto(project) });
  });

  return router;
}
