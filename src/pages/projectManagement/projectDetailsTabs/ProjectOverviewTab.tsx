import {
  HealthStatus,
  MethodologyType,
  ProjectStage,
} from "../../../config/enums";
import type { Project } from "../../../services/projectManagementServices/projectService";

type ProjectOverviewTabProps = {
  project: Project;
  canAccessDocumentsWorkspace: boolean;
  openDocumentsWorkspace: () => void;
  formatDate: (value?: string | null) => string;
};

export function ProjectOverviewTab({
  project,
  canAccessDocumentsWorkspace,
  openDocumentsWorkspace,
  formatDate,
}: ProjectOverviewTabProps) {
  return (
    <section className="project-details-grid">
      <article className="details-card">
        <h2 className="h6">Project Overview</h2>
        {/* <div className="details-row">
              <span>ID</span>
              <strong>{project.id}</strong>
            </div> */}
        <div className="details-row">
          <span>Stage</span>
          <strong>{ProjectStage[project.stage ?? 0]}</strong>
        </div>
        <div className="details-row">
          <span>Health</span>
          <strong>{HealthStatus[project.healthStatus ?? 0]}</strong>
        </div>
        <div className="details-row">
          <span>Methodology</span>
          <strong>{MethodologyType[project.methodology ?? 0]}</strong>
        </div>
        {/* <div className="details-row">
              <span>Portfolio</span>
              <strong>{project.portfolioId || "N/A"}</strong>
            </div> */}
      </article>

      <article className="details-card">
        <h2 className="h6">Schedule</h2>
        <div className="details-row">
          <span>Start Date</span>
          <strong>{formatDate(project.startDateUtc)}</strong>
        </div>
        <div className="details-row">
          <span>End Date</span>
          <strong>{formatDate(project.endDateUtc)}</strong>
        </div>
        <div className="details-row">
          <span>Created</span>
          <strong>{formatDate(project.createdDateUtc)}</strong>
        </div>
        <div className="details-row">
          <span>Updated</span>
          <strong>{formatDate(project.updatedDateUtc)}</strong>
        </div>
      </article>

      <article className="details-card full-width">
        <h2 className="h6">Objectives</h2>
        <p className="mb-0">
          {project.objectives || "No objectives provided."}
        </p>
      </article>

      <article className="details-card full-width">
        <h2 className="h6">Scope</h2>
        <p className="mb-0">{project.scope || "No scope provided."}</p>
      </article>

      <article className="details-card full-width documents-workspace-card">
        <div className="documents-workspace-head">
          <div className="documents-workspace-icon" aria-hidden="true">
            <i className="bi bi-folder2-open" />
          </div>
          <div>
            <h2 className="h6 mb-1">Documents Workspace</h2>
            <p className="documents-workspace-subtitle mb-0">
              Centralize plans, specs, reports, and contracts with version
              tracking.
            </p>
          </div>
        </div>

        <div className="documents-workspace-body">
          <div className="documents-workspace-feature">
            <i className="bi bi-check2-circle" />
            <span>Project-scoped document list</span>
          </div>
          <div className="documents-workspace-feature">
            <i className="bi bi-check2-circle" />
            <span>Create, update, and delete operations</span>
          </div>
          <div className="documents-workspace-feature">
            <i className="bi bi-check2-circle" />
            <span>Uploader and timestamp metadata</span>
          </div>
        </div>

        <div className="documents-workspace-actions">
          {canAccessDocumentsWorkspace ? (
            <button
              type="button"
              className="btn btn-info text-white"
              onClick={openDocumentsWorkspace}
            >
              <i className="bi bi-folder2-open me-2" />
              Open Documents Workspace
            </button>
          ) : (
            <div
              className="alert alert-light border mb-0 py-2 px-3"
              role="status"
            >
              <i className="bi bi-shield-lock me-2" />
              Documents workspace is not available for your permissions.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
