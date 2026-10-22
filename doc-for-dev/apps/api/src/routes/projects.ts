import type {
  ProjectService,
  TaskService,
  UserRepository
} from "@forgeboard/domain";
import { Router } from "express";
import { getActorId, requireActor } from "../http/actor";
import {
  toProjectDetailDto,
  toProjectSummaryDto
} from "../http/presenters";
import {
  parseCreateTaskBody,
  parseIncludeArchived,
  parseProjectStatusBody
} from "../http/validation";

interface ProjectRouteDependencies {
  users: UserRepository;
  projects: ProjectService;
  tasks: TaskService;
}

export function createProjectsRouter(
  dependencies: ProjectRouteDependencies
): Router {
  const router = Router();
  router.use(requireActor(dependencies.users));

  router.get("/", (req, res) => {
    const includeArchived = parseIncludeArchived(req.query.includeArchived);
    const actorId = getActorId(res);
    const projects = dependencies.projects
      .listProjects(actorId, { includeArchived })
      .map(toProjectSummaryDto);
    res.json({ projects });
  });

  router.post("/:projectId/tasks", (req, res) => {
    const actorId = getActorId(res);
    const projectId = req.params.projectId;
    const input = parseCreateTaskBody(req.body);

    dependencies.tasks.createTask(projectId, actorId, input);
    const project = dependencies.projects.getProject(projectId, actorId);
    res.status(201).json({ project: toProjectDetailDto(project) });
  });

  router.post("/:projectId/archive", (req, res) => {
    const actorId = getActorId(res);
    const project = dependencies.projects.archiveProject(
      req.params.projectId,
      actorId
    );
    res.json({ project: toProjectDetailDto(project) });
  });

  router.post("/:projectId/restore", (req, res) => {
    const actorId = getActorId(res);
    const project = dependencies.projects.restoreProject(
      req.params.projectId,
      actorId
    );
    res.json({ project: toProjectDetailDto(project) });
  });

  router.patch("/:projectId/status", (req, res) => {
    const actorId = getActorId(res);
    const nextStatus = parseProjectStatusBody(req.body);
    const project = dependencies.projects.changeStatus(
      req.params.projectId,
      actorId,
      nextStatus
    );
    res.json({ project: toProjectDetailDto(project) });
  });

  router.get("/:projectId", (req, res) => {
    const actorId = getActorId(res);
    const project = dependencies.projects.getProject(
      req.params.projectId,
      actorId
    );
    res.json({ project: toProjectDetailDto(project) });
  });

  return router;
}
