import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import portfolioService, {
  type Portfolio,
  type PortfolioCreateDTO,
  type PortfolioUpdateDTO,
} from "../services/portfolioService";
import "./styles/Portfolios.css";

type FormState = {
  name: string;
  description: string;
  portfolioManagerId: string;
};

const initialFormState: FormState = {
  name: "",
  description: "",
  portfolioManagerId: "",
};

function getCurrentUserIdFromLocalStorage() {
  try {
    const userRaw = localStorage.getItem("user");

    if (!userRaw) {
      return "";
    }

    const parsedUser = JSON.parse(userRaw) as { id?: string };
    return typeof parsedUser.id === "string" ? parsedUser.id : "";
  } catch {
    return "";
  }
}

function getCurrentUserNameFromLocalStorage() {
  try {
    const userRaw = localStorage.getItem("user");

    if (!userRaw) {
      return "";
    }

    const parsedUser = JSON.parse(userRaw) as {
      fullName?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      email?: string;
    };

    const fullName =
      parsedUser.fullName ||
      parsedUser.name ||
      `${parsedUser.firstName || ""} ${parsedUser.lastName || ""}`.trim() ||
      parsedUser.username ||
      parsedUser.email ||
      "";

    return typeof fullName === "string" ? fullName : "";
  } catch {
    return "";
  }
}

function getManagerDisplayName(
  managerId: string,
  currentUserId: string,
  currentUserName: string,
) {
  if (!managerId) {
    return "N/A";
  }

  if (currentUserId && managerId === currentUserId) {
    return currentUserName || managerId;
  }

  return managerId;
}

function normalizeText(value: string) {
  return value.trim();
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

export function Portfolios() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(initialFormState);

  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(
    null,
  );
  const [editForm, setEditForm] = useState<FormState>(initialFormState);

  const [detailsPortfolio, setDetailsPortfolio] = useState<Portfolio | null>(
    null,
  );
  const currentUserId = useMemo(() => getCurrentUserIdFromLocalStorage(), []);
  const currentUserName = useMemo(
    () => getCurrentUserNameFromLocalStorage(),
    [],
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPortfolios = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return portfolios;
    }

    return portfolios.filter((portfolio) => {
      const values = [
        portfolio.name,
        portfolio.description || "",
        portfolio.portfolioManagerId || "",
      ]
        .join(" ")
        .toLowerCase();

      return values.includes(searchValue);
    });
  }, [portfolios, search]);

  const portfolioCount = portfolios.length;
  const totalProjects = portfolios.reduce(
    (sum, portfolio) => sum + (portfolio.projects?.length || 0),
    0,
  );

  async function fetchPortfolios() {
    try {
      setLoading(true);
      const data = await portfolioService.getPortfolios();
      setPortfolios(data || []);
      setError(null);
    } catch (fetchError) {
      console.error(fetchError);
      const message = "Failed to load portfolios. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPortfolios();
  }, []);

  function handleCreateInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: PortfolioCreateDTO = {
      name: normalizeText(createForm.name),
      description: normalizeText(createForm.description) || undefined,
      portfolioManagerId: currentUserId || undefined,
    };

    if (!payload.name) {
      toast.error("Portfolio name is required.");
      return;
    }

    if (!payload.portfolioManagerId) {
      toast.error(
        "Cannot create portfolio: user id is missing in localStorage.",
      );
      return;
    }

    try {
      setSubmitting(true);
      await portfolioService.createPortfolio(payload);
      toast.success("Portfolio created successfully.");
      setCreateForm(initialFormState);
      setShowCreateForm(false);
      await fetchPortfolios();
    } catch (submitError) {
      console.error(submitError);
      toast.error("Failed to create portfolio.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenDetails(id: string) {
    try {
      setSubmitting(true);
      const data = await portfolioService.getPortfolioById(id);
      setDetailsPortfolio(data);
    } catch (detailsError) {
      console.error(detailsError);
      toast.error("Unable to load portfolio details.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenEdit(id: string) {
    try {
      setSubmitting(true);
      const data = await portfolioService.getPortfolioById(id);
      setEditingPortfolio(data);
      setEditForm({
        name: data.name || "",
        description: data.description || "",
        portfolioManagerId: data.portfolioManagerId || "",
      });
    } catch (editError) {
      console.error(editError);
      toast.error("Unable to load portfolio for editing.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingPortfolio) {
      return;
    }

    if (!editingPortfolio.rowVersion) {
      toast.error(
        "This portfolio cannot be updated because rowVersion is missing.",
      );
      return;
    }

    const payload: PortfolioUpdateDTO = {
      id: editingPortfolio.id,
      rowVersion: editingPortfolio.rowVersion,
      name: normalizeText(editForm.name),
      description: normalizeText(editForm.description) || undefined,
      portfolioManagerId:
        normalizeText(editForm.portfolioManagerId) || undefined,
    };

    if (!payload.name) {
      toast.error("Portfolio name is required.");
      return;
    }

    try {
      setSubmitting(true);
      await portfolioService.updatePortfolioById(editingPortfolio.id, payload);
      toast.success("Portfolio updated successfully.");
      setEditingPortfolio(null);
      setEditForm(initialFormState);
      await fetchPortfolios();
    } catch (updateError) {
      console.error(updateError);
      toast.error("Failed to update portfolio.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setSubmitting(true);
      await portfolioService.deletePortfolioById(id);
      toast.success("Portfolio deleted successfully.");
      setConfirmDeleteId(null);
      await fetchPortfolios();
    } catch (deleteError) {
      console.error(deleteError);
      toast.error("Failed to delete portfolio.");
    } finally {
      setSubmitting(false);
    }
  }

  function navigateToProjectDetails(portfolioId: string, projectId: string) {
    setDetailsPortfolio(null);
    navigate(`/dashboard/portfolios/${portfolioId}/projects/${projectId}`);
  }

  if (loading) {
    return (
      <div className="portfolio-loading d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div
            className="spinner-border text-info"
            role="status"
            aria-label="Loading portfolios"
          />
          <p className="mt-3 mb-0">Loading portfolios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <section className="portfolio-hero">
        <div>
          <p className="hero-label mb-2">Project Administration</p>
          <h1 className="hero-title mb-2">Portfolio Management</h1>
          <p className="hero-subtitle mb-0">
            Create and govern your portfolios, then track every project under
            each portfolio in one place.
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
          {showCreateForm ? "Close Form" : "New Portfolio"}
        </button>
      </section>

      <section className="portfolio-stats row g-3 mb-4">
        <div className="col-12 col-md-6">
          <article className="stat-tile">
            <p className="stat-label">Total Portfolios</p>
            <p className="stat-value">{portfolioCount}</p>
          </article>
        </div>
        <div className="col-12 col-md-6">
          <article className="stat-tile">
            <p className="stat-label">Total Projects</p>
            <p className="stat-value">{totalProjects}</p>
          </article>
        </div>
        {/* <div className="col-12 col-md-4">
          <article className="stat-tile">
            <p className="stat-label">Avg Projects/Portfolio</p>
            <p className="stat-value">{avgProjectsPerPortfolio}</p>
          </article>
        </div> */}
      </section>

      <section className="portfolio-controls mb-4">
        <div className="search-wrap">
          <i className="bi bi-search" />
          <input
            type="text"
            placeholder="Search portfolios by name, description, or manager id"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline-light"
          onClick={fetchPortfolios}
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
        <section className="portfolio-form-card mb-4">
          <div className="form-card-header">
            <h2 className="h5 mb-1">Create Portfolio</h2>
            <p className="mb-0">
              Use the API `POST /api/project-admin/portfolios`.
            </p>
          </div>
          <form onSubmit={handleCreateSubmit} className="row g-3">
            <div className="col-12 col-lg-6">
              <label className="form-label">Portfolio Name</label>
              <input
                className="form-control"
                name="name"
                value={createForm.name}
                onChange={handleCreateInputChange}
                maxLength={150}
                required
              />
            </div>
            <div className="col-12 col-lg-6">
              <label className="form-label">Portfolio Manager</label>
              <input
                className="form-control"
                value={
                  currentUserName ||
                  currentUserId ||
                  "No manager user found in localStorage"
                }
                maxLength={100}
                readOnly
              />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                name="description"
                value={createForm.description}
                onChange={handleCreateInputChange}
                rows={3}
                maxLength={500}
                placeholder="Optional"
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
                {submitting ? "Saving..." : "Create Portfolio"}
              </button>
            </div>
          </form>
        </section>
      )}

      {filteredPortfolios.length === 0 ? (
        <section className="portfolio-empty-state">
          <i className="bi bi-briefcase" />
          <h3>No portfolios found</h3>
          <p>Try changing your search, or create your first portfolio.</p>
        </section>
      ) : (
        <section className="portfolio-grid">
          {filteredPortfolios.map((portfolio) => (
            <article
              key={portfolio.id}
              className="portfolio-card portfolio-card-clickable"
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDetails(portfolio.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenDetails(portfolio.id);
                }
              }}
            >
              <header className="portfolio-card-header">
                <div>
                  <h3>{portfolio.name}</h3>
                  {/* <p className="manager-text mb-0">Manager ID: {portfolio.portfolioManagerId || 'N/A'}</p> */}
                </div>
                <span className="project-count-pill">
                  {portfolio.projects?.length || 0} projects
                </span>
              </header>

              <p className="portfolio-description">
                {portfolio.description || "No description provided."}
              </p>

              <div className="portfolio-meta mb-3">
                <span>
                  <i className="bi bi-calendar-check me-1" />
                  Created: {formatDate(portfolio.createdDateUtc)}
                </span>
                <span>
                  <i className="bi bi-clock-history me-1" />
                  Updated: {formatDate(portfolio.updatedDateUtc)}
                </span>
              </div>

              <div className="projects-section">
                <p className="projects-title mb-2">
                  Projects In This Portfolio
                </p>
                {portfolio.projects?.length ? (
                  <div className="projects-list">
                    {portfolio.projects.slice(0, 4).map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className="project-chip project-chip-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigateToProjectDetails(portfolio.id, project.id);
                        }}
                      >
                        <i className="bi bi-folder2-open" />
                        <span>{project.name || "Unnamed project"}</span>
                      </button>
                    ))}
                    {portfolio.projects.length > 4 && (
                      <div className="project-chip muted-chip">
                        +{portfolio.projects.length - 4} more projects
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted mb-0">
                    No projects are assigned yet.
                  </p>
                )}
              </div>

              <footer className="portfolio-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDetails(portfolio.id);
                  }}
                  disabled={submitting}
                >
                  <i className="bi bi-eye me-1" />
                  View
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenEdit(portfolio.id);
                  }}
                  disabled={submitting}
                >
                  <i className="bi bi-pencil-square me-1" />
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteId(portfolio.id);
                  }}
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

      {detailsPortfolio && (
        <div
          className="portfolio-drawer-backdrop"
          onClick={() => setDetailsPortfolio(null)}
        >
          <div
            className="portfolio-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <p className="drawer-kicker">Portfolio Overview</p>
                <h2 className="drawer-title">{detailsPortfolio.name}</h2>
              </div>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setDetailsPortfolio(null)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="drawer-body">
              <div className="drawer-stats">
                <div className="drawer-stat">
                  <span className="drawer-stat-label">Created</span>
                  <span className="drawer-stat-value">
                    {formatDate(detailsPortfolio.createdDateUtc)}
                  </span>
                </div>
                <div className="drawer-stat">
                  <span className="drawer-stat-label">Last Updated</span>
                  <span className="drawer-stat-value">
                    {formatDate(detailsPortfolio.updatedDateUtc)}
                  </span>
                </div>
                <div className="drawer-stat">
                  <span className="drawer-stat-label">Projects</span>
                  <span className="drawer-stat-value">
                    {detailsPortfolio.projects?.length || 0}
                  </span>
                </div>
              </div>

              {detailsPortfolio.description && (
                <div className="drawer-description">
                  <p className="drawer-section-label">Description</p>
                  <p className="mb-0">{detailsPortfolio.description}</p>
                </div>
              )}

              <div className="drawer-projects">
                <div className="drawer-projects-header">
                  <p className="drawer-section-label mb-0">Projects</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-info text-white"
                    onClick={() => {
                      setDetailsPortfolio(null);
                      navigate(
                        `/dashboard/project-management/projects/create?portfolioId=${detailsPortfolio.id}`,
                      );
                    }}
                  >
                    <i className="bi bi-plus-circle me-1" />
                    New Project
                  </button>
                </div>
                {detailsPortfolio.projects?.length ? (
                  <div className="drawer-project-list">
                    {detailsPortfolio.projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className="drawer-project-item"
                        onClick={() =>
                          navigateToProjectDetails(
                            detailsPortfolio.id,
                            project.id,
                          )
                        }
                      >
                        <div className="drawer-project-info">
                          <i className="bi bi-folder2-open" />
                          <span>{project.name || "Unnamed project"}</span>
                        </div>
                        <i className="bi bi-chevron-right drawer-project-arrow" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="drawer-empty-projects">
                    <i className="bi bi-folder" />
                    <p>No projects in this portfolio yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div
          className="portfolio-drawer-backdrop"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-dialog-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>
            <h3 className="confirm-dialog-title">Delete Portfolio</h3>
            <p className="confirm-dialog-text">
              Are you sure you want to delete{" "}
              <strong>
                {portfolios.find((p) => p.id === confirmDeleteId)?.name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setConfirmDeleteId(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPortfolio && (
        <div
          className="portfolio-drawer-backdrop"
          onClick={() => {
            setEditingPortfolio(null);
            setEditForm(initialFormState);
          }}
        >
          <div
            className="confirm-dialog"
            style={{ width: "min(500px, 90%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="confirm-dialog-title"
              style={{ marginBottom: "1.25rem" }}
            >
              Edit Portfolio
            </h3>
            <form onSubmit={handleEditSubmit} className="row g-3 text-start">
              <div className="col-12">
                <label className="form-label">Portfolio Name</label>
                <input
                  className="form-control"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditInputChange}
                  maxLength={150}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">Portfolio Manager</label>
                <input
                  className="form-control"
                  value={getManagerDisplayName(
                    editForm.portfolioManagerId,
                    currentUserId,
                    currentUserName,
                  )}
                  maxLength={100}
                  readOnly
                />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditInputChange}
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="col-12 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setEditingPortfolio(null);
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
                  {submitting ? "Saving..." : "Update Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Portfolios;
