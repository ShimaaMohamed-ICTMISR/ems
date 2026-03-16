import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";
import projectService, {
  type Project,
  type ProjectCreateDTO,
  type ProjectUpdateDTO,
} from "../services/projectService";
import portfolioService, { type Portfolio } from "../services/portfolioService";
import { ProjectStage, HealthStatus, MethodologyType } from "../config/enums";
import "./styles/Projects.css";

type FormState = {
  name: string;
  objectives: string;
  scope: string;
  startDateUtc: string;
  endDateUtc: string;
  stage: string;
  healthStatus: string;
  methodology: string;
  portfolioId: string;
  templateId: string;
};

const initialFormState: FormState = {
  name: "",
  objectives: "",
  scope: "",
  startDateUtc: "",
  endDateUtc: "",
  stage: "0",
  healthStatus: "2",
  methodology: "1",
  portfolioId: "",
  templateId: "",
};

function normalizeText(value: string) {
  return value.trim();
}

function safeInt(value: string | undefined, fallback = 0): number {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString();
}

function toDateInputValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(initialFormState);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState<FormState>(initialFormState);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return projects;
    }

    return projects.filter((project) => {
      const haystack = [
        project.name || "",
        project.objectives || "",
        project.scope || "",
        ProjectStage[project.stage || 0],
        MethodologyType[project.methodology || 0],
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchValue);
    });
  }, [projects, search]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (project) => (project.stage ?? 0) === 2,
  ).length;
  const healthyProjects = projects.filter(
    (project) => (project.healthStatus ?? 0) === 2,
  ).length;

  async function fetchProjects() {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data || []);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      const message = "Failed to load projects. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPortfolios() {
    try {
      const data = await portfolioService.getPortfolios();
      setPortfolios(data || []);
    } catch {
      setPortfolios([]);
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchPortfolios();
  }, []);

  function handleCreateInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function buildCreatePayload(form: FormState): ProjectCreateDTO {
    return {
      name: normalizeText(form.name),
      objectives: normalizeText(form.objectives) || undefined,
      scope: normalizeText(form.scope) || undefined,
      startDateUtc: toIsoDate(form.startDateUtc),
      endDateUtc: toIsoDate(form.endDateUtc),
      stage: safeInt(form.stage),
      healthStatus: safeInt(form.healthStatus),
      methodology: safeInt(form.methodology),
      portfolioId: normalizeText(form.portfolioId) || undefined,
      templateId: normalizeText(form.templateId) || undefined,
    };
  }

  function buildUpdatePayload(
    project: Project,
    form: FormState,
  ): ProjectUpdateDTO {
    return {
      id: project.id,
      rowVersion: project.rowVersion || "",
      name: normalizeText(form.name),
      objectives: normalizeText(form.objectives) || undefined,
      scope: normalizeText(form.scope) || undefined,
      startDateUtc: toIsoDate(form.startDateUtc),
      endDateUtc: toIsoDate(form.endDateUtc),
      stage: safeInt(form.stage),
      healthStatus: safeInt(form.healthStatus),
      methodology: safeInt(form.methodology),
      portfolioId: normalizeText(form.portfolioId) || undefined,
      templateId: normalizeText(form.templateId) || undefined,
    };
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = buildCreatePayload(createForm);

    if (!payload.name) {
      toast.error("Project name is required.");
      return;
    }

    try {
      setSubmitting(true);
      await projectService.createProject(payload);
      toast.success("Project created successfully.");
      setCreateForm(initialFormState);
      setShowCreateForm(false);
      await fetchProjects();
    } catch (createError) {
      console.error(createError);
      toast.error("Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenDetails(id: string) {
    try {
      setSubmitting(true);
      const data = await projectService.getProjectById(id);
      setDetailsProject(data);
    } catch (detailsError) {
      console.error(detailsError);
      toast.error("Unable to load project details.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenEdit(id: string) {
    try {
      setSubmitting(true);
      const data = await projectService.getProjectById(id);
      setEditingProject(data);
      setEditForm({
        name: data.name || "",
        objectives: data.objectives || "",
        scope: data.scope || "",
        startDateUtc: toDateInputValue(data.startDateUtc),
        endDateUtc: toDateInputValue(data.endDateUtc),
        stage: String(data.stage ?? 0),
        healthStatus: String(data.healthStatus ?? 2),
        methodology: String(data.methodology ?? 1),
        portfolioId: data.portfolioId || "",
        templateId: data.templateId || "",
      });
    } catch (editError) {
      console.error(editError);
      toast.error("Unable to load project for editing.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingProject) {
      return;
    }

    if (!editingProject.rowVersion) {
      toast.error("Cannot update project: rowVersion is missing.");
      return;
    }

    const payload = buildUpdatePayload(editingProject, editForm);

    if (!payload.name) {
      toast.error("Project name is required.");
      return;
    }

    try {
      setSubmitting(true);
      await projectService.updateProjectById(editingProject.id, payload);
      toast.success("Project updated successfully.");
      setEditingProject(null);
      setEditForm(initialFormState);
      await fetchProjects();
    } catch (updateError) {
      console.error(updateError);
      toast.error("Failed to update project.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete project \"${name}\"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      await projectService.deleteProjectById(id);
      toast.success("Project deleted successfully.");
      await fetchProjects();
    } catch (deleteError) {
      console.error(deleteError);
      toast.error("Failed to delete project.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="projects-loading d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div
            className="spinner-border text-info"
            role="status"
            aria-label="Loading projects"
          />
          <p className="mt-3 mb-0">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <section className="projects-hero mb-4">
        <div>
          <p className="projects-kicker mb-2">Project Management</p>
          <h1 className="projects-title mb-2">Projects Workspace</h1>
          <p className="projects-subtitle mb-0">
            Use `GET/POST /api/Projects` and `GET/PUT/DELETE /api/Projects/
            {"{id}"}` directly from the UI.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-info text-white fw-semibold"
          onClick={() => setShowCreateForm((prev) => !prev)}
          disabled={submitting}
        >
          <i
            className={`bi ${showCreateForm ? "bi-x-circle" : "bi-plus-circle"} me-2`}
          />
          {showCreateForm ? "Close Form" : "New Project"}
        </button>
      </section>

      <section className="projects-stats row g-3 mb-4">
        <div className="col-12 col-md-4">
          <article className="stat-tile">
            <p className="stat-label">Total Projects</p>
            <p className="stat-value">{totalProjects}</p>
          </article>
        </div>
        <div className="col-12 col-md-4">
          <article className="stat-tile">
            <p className="stat-label">Execution Stage</p>
            <p className="stat-value">{activeProjects}</p>
          </article>
        </div>
        <div className="col-12 col-md-4">
          <article className="stat-tile">
            <p className="stat-label">Healthy Projects</p>
            <p className="stat-value">{healthyProjects}</p>
          </article>
        </div>
      </section>

      <section className="projects-controls mb-4">
        <div className="projects-search">
          <i className="bi bi-search" />
          <input
            type="text"
            placeholder="Search by name, scope, objectives, stage, methodology"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={fetchProjects}
          disabled={submitting}
        >
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh
        </button>
      </section>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      {showCreateForm && (
        <section className="projects-form-card mb-4">
          <div className="mb-3">
            <h2 className="h5 mb-1">Create Project</h2>
            <p className="text-muted mb-0">Required field: project name.</p>
          </div>

          <form className="row g-3" onSubmit={handleCreateSubmit}>
            <div className="col-12 col-lg-6">
              <label className="form-label">Project Name</label>
              <input
                className="form-control"
                name="name"
                value={createForm.name}
                onChange={handleCreateInputChange}
                maxLength={200}
                required
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Portfolio</label>
              <select
                className="form-select"
                name="portfolioId"
                value={createForm.portfolioId}
                onChange={handleCreateInputChange}
              >
                <option value="">No portfolio</option>
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Template ID (Optional)</label>
              <input
                className="form-control"
                name="templateId"
                value={createForm.templateId}
                onChange={handleCreateInputChange}
                placeholder="Optional UUID"
              />
            </div>

            <div className="col-12 col-lg-4">
              <label className="form-label">Stage</label>
              <select
                className="form-select"
                name="stage"
                value={createForm.stage}
                onChange={handleCreateInputChange}
              >
                {Object.entries(ProjectStage).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Health</label>
              <select
                className="form-select"
                name="healthStatus"
                value={createForm.healthStatus}
                onChange={handleCreateInputChange}
              >
                {Object.entries(HealthStatus).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Methodology</label>
              <select
                className="form-select"
                name="methodology"
                value={createForm.methodology}
                onChange={handleCreateInputChange}
              >
                {Object.entries(MethodologyType).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-lg-6">
              <label className="form-label">Start Date</label>
              <input
                className="form-control"
                type="date"
                name="startDateUtc"
                value={createForm.startDateUtc}
                onChange={handleCreateInputChange}
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">End Date</label>
              <input
                className="form-control"
                type="date"
                name="endDateUtc"
                value={createForm.endDateUtc}
                onChange={handleCreateInputChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label">Objectives</label>
              <textarea
                className="form-control"
                rows={2}
                name="objectives"
                value={createForm.objectives}
                onChange={handleCreateInputChange}
                maxLength={2000}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Scope</label>
              <textarea
                className="form-control"
                rows={2}
                name="scope"
                value={createForm.scope}
                onChange={handleCreateInputChange}
                maxLength={2000}
              />
            </div>

            <div className="col-12 d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setCreateForm(initialFormState);
                  setShowCreateForm(false);
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-info text-white"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create Project"}
              </button>
            </div>
          </form>
        </section>
      )}

      {filteredProjects.length === 0 ? (
        <section className="projects-empty">
          <i className="bi bi-kanban" />
          <h3 className="mt-2">No projects found</h3>
          <p className="mb-0">
            Try another search term or create your first project.
          </p>
        </section>
      ) : (
        <section className="projects-grid">
          {filteredProjects.map((project) => (
            <article key={project.id} className="project-card">
              <header className="project-card-header">
                <div>
                  <h3 className="project-card-title">
                    {project.name || "Unnamed project"}
                  </h3>
                  <p className="project-id mb-0">
                    ID: {project.id.slice(0, 12)}...
                  </p>
                </div>
              </header>

              <div className="project-meta">
                <span className="meta-chip">
                  {ProjectStage[project.stage ?? 0]}
                </span>
                <span className="meta-chip">
                  {HealthStatus[project.healthStatus ?? 0]}
                </span>
                <span className="meta-chip">
                  {MethodologyType[project.methodology ?? 0]}
                </span>
              </div>

              <p className="project-text">
                {project.objectives ||
                  project.scope ||
                  "No objectives or scope added yet."}
              </p>

              <div className="project-dates">
                <span>
                  <i className="bi bi-calendar-event me-1" />
                  Start: {formatDate(project.startDateUtc)}
                </span>
                <span>
                  <i className="bi bi-calendar-check me-1" />
                  End: {formatDate(project.endDateUtc)}
                </span>
              </div>

              <footer className="project-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info"
                  onClick={() => handleOpenDetails(project.id)}
                  disabled={submitting}
                >
                  <i className="bi bi-eye me-1" />
                  View
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning"
                  onClick={() => handleOpenEdit(project.id)}
                  disabled={submitting}
                >
                  <i className="bi bi-pencil-square me-1" />
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() =>
                    handleDelete(project.id, project.name || "Unnamed project")
                  }
                  disabled={submitting}
                >
                  <i className="bi bi-trash me-1" />
                  Delete
                </button>
              </footer>
            </article>
          ))}
        </section>
      )}

      {detailsProject && (
        <div
          className="projects-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="projects-modal-card">
            <div className="projects-modal-header">
              <h2 className="h5 mb-0">Project Details</h2>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setDetailsProject(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="projects-modal-body">
              <p>
                <strong>ID:</strong> {detailsProject.id}
              </p>
              <p>
                <strong>Name:</strong> {detailsProject.name || "N/A"}
              </p>
              <p>
                <strong>Stage:</strong>{" "}
                {ProjectStage[detailsProject.stage ?? 0]}
              </p>
              <p>
                <strong>Health:</strong>{" "}
                {HealthStatus[detailsProject.healthStatus ?? 0]}
              </p>
              <p>
                <strong>Methodology:</strong>{" "}
                {MethodologyType[detailsProject.methodology ?? 0]}
              </p>
              <p>
                <strong>Portfolio ID:</strong>{" "}
                {detailsProject.portfolioId || "N/A"}
              </p>
              <p>
                <strong>Objectives:</strong>{" "}
                {detailsProject.objectives || "N/A"}
              </p>
              <p>
                <strong>Scope:</strong> {detailsProject.scope || "N/A"}
              </p>
              <p>
                <strong>Start Date:</strong>{" "}
                {formatDate(detailsProject.startDateUtc)}
              </p>
              <p>
                <strong>End Date:</strong>{" "}
                {formatDate(detailsProject.endDateUtc)}
              </p>
            </div>
          </div>
        </div>
      )}

      {editingProject && (
        <div
          className="projects-modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="projects-modal-card">
            <div className="projects-modal-header">
              <h2 className="h5 mb-0">Edit Project</h2>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setEditingProject(null);
                  setEditForm(initialFormState);
                }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form
              className="projects-modal-body row g-3"
              onSubmit={handleEditSubmit}
            >
              <div className="col-12 col-lg-6">
                <label className="form-label">Project Name</label>
                <input
                  className="form-control"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditInputChange}
                  maxLength={200}
                  required
                />
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label">Portfolio</label>
                <select
                  className="form-select"
                  name="portfolioId"
                  value={editForm.portfolioId}
                  onChange={handleEditInputChange}
                >
                  <option value="">No portfolio</option>
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label">Template ID (Optional)</label>
                <input
                  className="form-control"
                  name="templateId"
                  value={editForm.templateId}
                  onChange={handleEditInputChange}
                  placeholder="Optional UUID"
                />
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label">Stage</label>
                <select
                  className="form-select"
                  name="stage"
                  value={editForm.stage}
                  onChange={handleEditInputChange}
                >
                  {Object.entries(ProjectStage).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-4">
                <label className="form-label">Health</label>
                <select
                  className="form-select"
                  name="healthStatus"
                  value={editForm.healthStatus}
                  onChange={handleEditInputChange}
                >
                  {Object.entries(HealthStatus).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-lg-4">
                <label className="form-label">Methodology</label>
                <select
                  className="form-select"
                  name="methodology"
                  value={editForm.methodology}
                  onChange={handleEditInputChange}
                >
                  {Object.entries(MethodologyType).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-lg-6">
                <label className="form-label">Start Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="startDateUtc"
                  value={editForm.startDateUtc}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="col-12 col-lg-6">
                <label className="form-label">End Date</label>
                <input
                  className="form-control"
                  type="date"
                  name="endDateUtc"
                  value={editForm.endDateUtc}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Objectives</label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="objectives"
                  value={editForm.objectives}
                  onChange={handleEditInputChange}
                  maxLength={2000}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Scope</label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="scope"
                  value={editForm.scope}
                  onChange={handleEditInputChange}
                  maxLength={2000}
                />
              </div>

              <div className="col-12 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setEditingProject(null);
                    setEditForm(initialFormState);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Update Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
