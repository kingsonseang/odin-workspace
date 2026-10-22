import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  CreateTaskRequest,
  ProjectDetailDto,
  ProjectStatus,
  TaskStatus
} from "@forgeboard/shared";
import { PROJECT_STATUS_LABELS } from "@forgeboard/shared";
import {
  ApiClientError,
  api,
  errorMessage
} from "../api/client";
import { ActivityFeed } from "../components/ActivityFeed";
import { InitialsAvatar } from "../components/InitialsAvatar";
import { NewTaskForm } from "../components/NewTaskForm";
import { LoadingPage, PageState } from "../components/PageState";
import { ProgressBar } from "../components/ProgressBar";
import { TaskList } from "../components/TaskList";
import { ProjectStatusBadge } from "../components/StatusBadge";
import { useSession } from "../context/SessionContext";
import { formatDate, pluralize } from "../utils/format";

function projectActionLabel(
  current: ProjectStatus,
  target: ProjectStatus
): string {
  if (target === "active") {
    if (current === "completed") {
      return "Reopen project";
    }
    if (current === "paused") {
      return "Resume project";
    }
    return "Start project";
  }
  if (target === "paused") {
    return "Pause project";
  }
  if (target === "completed") {
    return "Complete project";
  }
  return `Move to ${PROJECT_STATUS_LABELS[target]}`;
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const actorId = currentUser?.id;

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!actorId || !projectId) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    setNotFound(false);
    setActionError(null);
    setProject(null);

    api
      .getProject(actorId, projectId, controller.signal)
      .then(({ project: nextProject }) => {
        setProject(nextProject);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(errorMessage(error));
        setNotFound(error instanceof ApiClientError && error.status === 404);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [actorId, projectId, reloadKey]);

  if (!currentUser) {
    return <LoadingPage label="Choosing a demo identity…" />;
  }

  if (isLoading) {
    return <LoadingPage label="Loading project…" />;
  }

  if (loadError) {
    return (
      <PageState
        title={notFound ? "Project not found" : "Project could not be loaded"}
        message={
          notFound
            ? "This project may have been removed, or the link may be incorrect."
            : loadError
        }
        actionLabel={notFound ? "Back to projects" : "Try again"}
        onAction={() =>
          notFound
            ? navigate("/")
            : setReloadKey((value) => value + 1)
        }
      />
    );
  }

  if (!project) {
    return (
      <PageState
        title="Project could not be loaded"
        message="No project data was returned."
        actionLabel="Try again"
        onAction={() => setReloadKey((value) => value + 1)}
      />
    );
  }

  const busy = pending !== null;

  async function performAction(
    key: string,
    action: () => Promise<{ project: ProjectDetailDto }>
  ): Promise<boolean> {
    setPending(key);
    setActionError(null);
    try {
      const response = await action();
      setProject(response.project);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    } finally {
      setPending(null);
    }
  }

  function changeProjectStatus(status: ProjectStatus): void {
    if (!currentUser || !project) {
      return;
    }
    void performAction(`project-status-${status}`, () =>
      api.updateProjectStatus(currentUser.id, project.id, status)
    );
  }

  function archiveProject(): void {
    if (!currentUser || !project) {
      return;
    }
    void performAction("archive", () =>
      api.archiveProject(currentUser.id, project.id)
    );
  }

  function restoreProject(): void {
    if (!currentUser || !project) {
      return;
    }
    void performAction("restore", () =>
      api.restoreProject(currentUser.id, project.id)
    );
  }

  function changeTaskStatus(taskId: string, status: TaskStatus): void {
    if (!currentUser) {
      return;
    }
    void performAction(`task-${taskId}-${status}`, () =>
      api.updateTaskStatus(currentUser.id, taskId, status)
    );
  }

  async function createTask(input: CreateTaskRequest): Promise<boolean> {
    if (!currentUser || !project) {
      return false;
    }
    return performAction("create-task", () =>
      api.createTask(currentUser.id, project.id, input)
    );
  }

  return (
    <div className="page page--detail">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Projects</Link>
        <span aria-hidden="true">/</span>
        <span>{project.key}</span>
      </nav>

      {project.archivedAt && (
        <div className="archive-banner">
          <div>
            <strong>This project is archived.</strong>
            <span>
              It was archived on {formatDate(project.archivedAt)} and is
              read-only until restored.
            </span>
          </div>
          {project.capabilities.canRestore && (
            <button
              type="button"
              className="button button--secondary"
              disabled={busy}
              onClick={restoreProject}
            >
              {pending === "restore" ? "Restoring…" : "Restore project"}
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div className="alert alert--error" role="alert">
          <p>{actionError}</p>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss error"
            onClick={() => setActionError(null)}
          >
            ×
          </button>
        </div>
      )}

      <header className="project-hero">
        <div className="project-hero__kicker">
          <span className="project-key">{project.key}</span>
          <ProjectStatusBadge status={project.status} />
          {project.archivedAt && (
            <span className="archived-label">Archived</span>
          )}
        </div>
        <h1>{project.name}</h1>
        <p className="project-hero__description">{project.description}</p>
        <div className="project-hero__meta">
          <span className="meta-person">
            <InitialsAvatar user={project.lead} size="sm" />
            <span>
              <em>Lead</em>
              {project.lead.name}
            </span>
          </span>
          <span>{pluralize(project.memberCount, "member")}</span>
          <span>{pluralize(project.taskCounts.total, "task")}</span>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-primary">
          <section className="panel progress-panel">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Delivery signal</p>
                <h2>Progress</h2>
              </div>
            </div>

            <ProgressBar progress={project.progress} />

            <div className="progress-breakdown">
              <span>
                <strong>{project.taskCounts.open}</strong> open
              </span>
              <span>
                <strong>{project.taskCounts.done}</strong> done
              </span>
              <span>
                <strong>{project.taskCounts.cancelled}</strong> cancelled
              </span>
            </div>

            {project.availableProjectTransitions.length > 0 ||
            project.capabilities.canArchive ? (
              <div className="project-actions" aria-busy={busy}>
                {project.availableProjectTransitions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="button button--secondary"
                    disabled={busy}
                    onClick={() => changeProjectStatus(status)}
                  >
                    {projectActionLabel(project.status, status)}
                  </button>
                ))}
                {project.capabilities.canArchive && (
                  <button
                    type="button"
                    className="button button--quiet"
                    disabled={busy}
                    onClick={archiveProject}
                  >
                    {pending === "archive"
                      ? "Archiving…"
                      : "Archive project"}
                  </button>
                )}
              </div>
            ) : null}
          </section>

          <section
            className="panel tasks-panel"
            aria-labelledby="tasks-title"
            aria-busy={busy}
          >
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Execution</p>
                <h2 id="tasks-title">
                  Tasks <span className="count-badge">{project.tasks.length}</span>
                </h2>
              </div>
            </div>

            {project.capabilities.canCreateTask && (
              <div className="tasks-toolbar">
                <NewTaskForm
                  members={project.members}
                  currentUser={currentUser}
                  disabled={busy}
                  onCreate={createTask}
                />
              </div>
            )}

            <TaskList
              tasks={project.tasks}
              disabled={busy}
              onTransition={changeTaskStatus}
            />
          </section>
        </div>

        <aside className="detail-secondary">
          <section className="panel members-panel" aria-labelledby="members-title">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Team</p>
                <h2 id="members-title">Members</h2>
              </div>
              <span className="count-badge">{project.members.length}</span>
            </div>
            <ul className="member-list">
              {project.members.map((member) => (
                <li key={member.id} className="member-row">
                  <InitialsAvatar user={member} size="md" />
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.title}</span>
                  </div>
                  {member.id === project.lead.id && (
                    <span className="lead-chip">Lead</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <ActivityFeed activity={project.activity} />
        </aside>
      </div>
    </div>
  );
}
