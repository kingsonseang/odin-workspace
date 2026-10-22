import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ProjectSummaryDto } from "@forgeboard/shared";
import { api, errorMessage } from "../api/client";
import { InitialsAvatar } from "../components/InitialsAvatar";
import { LoadingPage, PageState } from "../components/PageState";
import { ProgressBar } from "../components/ProgressBar";
import { ProjectStatusBadge } from "../components/StatusBadge";
import { useSession } from "../context/SessionContext";
import { pluralize } from "../utils/format";

export function ProjectListPage() {
  const { currentUser } = useSession();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);

    api
      .listProjects(
        currentUser.id,
        { includeArchived },
        controller.signal
      )
      .then(({ projects: nextProjects }) => {
        setProjects(nextProjects);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentUser, includeArchived, reloadKey]);

  if (!currentUser) {
    return <LoadingPage label="Choosing a demo identity…" />;
  }

  if (isLoading) {
    return <LoadingPage label="Loading projects…" />;
  }

  if (loadError) {
    return (
      <PageState
        title="Projects could not be loaded"
        message={loadError}
        actionLabel="Try again"
        onAction={() => setReloadKey((value) => value + 1)}
      />
    );
  }

  const openTasks = projects.reduce(
    (total, project) => total + project.taskCounts.open,
    0
  );
  const activeProjects = projects.filter(
    (project) =>
      project.archivedAt === null && project.status === "active"
  ).length;

  return (
    <div className="page page--list">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Workspace overview</p>
          <h1>Projects</h1>
          <p className="page-heading__lede">
            A shared read on what the team is moving forward, what is
            waiting, and what has already shipped.
          </p>
        </div>
        <div className="identity-note">
          <InitialsAvatar user={currentUser} size="md" />
          <div>
            <span>Viewing as</span>
            <strong>{currentUser.name}</strong>
          </div>
        </div>
      </header>

      <div className="workspace-toolbar">
        <div
          className="segmented-control"
          role="group"
          aria-label="Project visibility"
        >
          <button
            type="button"
            className={!includeArchived ? "is-selected" : ""}
            aria-pressed={!includeArchived}
            onClick={() => setIncludeArchived(false)}
          >
            Current projects
          </button>
          <button
            type="button"
            className={includeArchived ? "is-selected" : ""}
            aria-pressed={includeArchived}
            onClick={() => setIncludeArchived(true)}
          >
            Include archived
          </button>
        </div>
        <p className="workspace-toolbar__hint">
          Project actions follow the demo identity selected above.
        </p>
      </div>

      <div className="stat-strip" aria-label="Visible project summary">
        <div className="stat">
          <span className="stat__value">{projects.length}</span>
          <span className="stat__label">visible projects</span>
        </div>
        <div className="stat">
          <span className="stat__value">{activeProjects}</span>
          <span className="stat__label">active now</span>
        </div>
        <div className="stat">
          <span className="stat__value">{openTasks}</span>
          <span className="stat__label">open tasks</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__mark" aria-hidden="true">
            ◌
          </span>
          <h2>No projects in this view</h2>
          <p>
            {includeArchived
              ? "The workspace does not have any projects yet."
              : "There are no current projects. Try including archived projects."}
          </p>
          {!includeArchived && (
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setIncludeArchived(true)}
            >
              Include archived
            </button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <Link
              className={`project-card ${project.archivedAt ? "project-card--archived" : ""}`}
              key={project.id}
              to={`/projects/${project.id}`}
            >
              <div className="project-card__top">
                <span className="project-key">{project.key}</span>
                <ProjectStatusBadge status={project.status} />
                {project.archivedAt && (
                  <span className="archived-label">Archived</span>
                )}
              </div>

              <h2>{project.name}</h2>
              <p className="project-card__description">
                {project.description}
              </p>

              <ProgressBar compact progress={project.progress} />

              <div className="project-card__footer">
                <span className="project-card__lead">
                  <InitialsAvatar user={project.lead} size="sm" />
                  <span>
                    <em>Lead</em>
                    {project.lead.name}
                  </span>
                </span>
                <span className="project-card__counts">
                  {pluralize(project.memberCount, "member")}
                  <span aria-hidden="true">·</span>
                  {project.taskCounts.open} open
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
