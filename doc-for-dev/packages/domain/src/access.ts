import type { Project, Task } from "./entities";
import { getArchiveEligibility } from "./workflow";

export function isProjectLead(project: Project, actorId: string): boolean {
  return project.leadId === actorId;
}

export function isProjectMember(project: Project, actorId: string): boolean {
  return project.memberIds.includes(actorId);
}

export function canManageProject(project: Project, actorId: string): boolean {
  return project.archivedAt === null && isProjectLead(project, actorId);
}

export function canContributeTasks(project: Project, actorId: string): boolean {
  return (
    project.archivedAt === null &&
    project.status !== "completed" &&
    isProjectMember(project, actorId)
  );
}

export function canArchiveProject(
  project: Project,
  tasks: Task[],
  actorId: string
): boolean {
  return (
    isProjectLead(project, actorId) &&
    getArchiveEligibility(project, tasks).eligible
  );
}

export function canRestoreProject(project: Project, actorId: string): boolean {
  return project.archivedAt !== null && isProjectLead(project, actorId);
}
