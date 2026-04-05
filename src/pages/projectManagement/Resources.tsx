import { useEffect, useState, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";
import { AccessDeniedState } from "../../Components/AccessDeniedState";
import {
  PM_PERMISSION_KEYS,
  PM_ROUTE_PERMISSION_KEYS,
} from "../../config/projectManagementPermissions";
import { useProjectManagementPermissions } from "../../hooks/useProjectManagementPermissions";
import {
  resourceService,
  resourceRequestService,
  type Resource,
  type ResourceCreateDTO,
  type ResourceUpdateDTO,
  type ResourceRequest,
} from "../../services/projectManagementServices/resourceService";
import projectService, {
  type Project,
} from "../../services/projectManagementServices/projectService";
import { ResourceType, RequestStatus } from "../../config/enums";
import ".././styles/Resources.css";

const initialForm = {
  name: "",
  type: "0",
  totalCapacityPercentage: "100",
  skillsOrNotes: "",
};

export function Resources() {
  const { canAny } = useProjectManagementPermissions();

  const hasResourcesAccess = canAny([...PM_ROUTE_PERMISSION_KEYS.RESOURCES]);
  const canViewResources = canAny([...PM_PERMISSION_KEYS.RESOURCES.VIEW]);
  const canCreateResource = canAny([...PM_PERMISSION_KEYS.RESOURCES.CREATE]);
  const canEditResource = canAny([...PM_PERMISSION_KEYS.RESOURCES.EDIT]);
  const canDeleteResource = canAny([...PM_PERMISSION_KEYS.RESOURCES.DELETE]);

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialForm);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  const [detailRequests, setDetailRequests] = useState<
    (ResourceRequest & { projectName?: string })[]
  >([]);
  const [detailRequestsLoading, setDetailRequestsLoading] = useState(false);

  const requestStatusColor: Record<number, string> = {
    0: "#3b82f6",
    1: "#f59e0b",
    2: "#22c55e",
    3: "#ef4444",
    4: "#6b7280",
  };

  const openDetail = useCallback(async (r: Resource) => {
    if (!canViewResources) {
      toast.error("You do not have permission to view resource details.");
      return;
    }

    setDetailResource(r);
    setDetailRequests([]);
    setDetailRequestsLoading(true);
    try {
      const [allRequests, allProjects] = await Promise.all([
        resourceRequestService.getAll(),
        projectService.getProjects(),
      ]);
      const projectMap = new Map(
        allProjects.map((p: Project) => [p.id, p.name || "Unnamed Project"]),
      );
      const matched = allRequests
        .filter((req: ResourceRequest) => req.resourceId === r.id)
        .map((req: ResourceRequest) => ({
          ...req,
          projectName:
            projectMap.get(req.projectId ?? "") || req.projectId || "—",
        }));
      setDetailRequests(matched);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailRequestsLoading(false);
    }
  }, [canViewResources]);

  useEffect(() => {
    if (!hasResourcesAccess) {
      setLoading(false);
      return;
    }

    fetchResources();
  }, [hasResourcesAccess, canViewResources]);

  async function fetchResources() {
    if (!canViewResources) {
      setResources([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await resourceService.getAll();
      setResources(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    if (!canCreateResource) {
      toast.error("You do not have permission to create resources.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Resource name is required.");
      return;
    }
    try {
      setCreating(true);
      const payload: ResourceCreateDTO = {
        name: form.name.trim(),
        type: parseInt(form.type, 10),
        totalCapacityPercentage:
          parseFloat(form.totalCapacityPercentage) || 100,
        skillsOrNotes: form.skillsOrNotes.trim() || undefined,
      };
      await resourceService.create(payload);
      toast.success("Resource created.");
      setForm(initialForm);
      setShowCreate(false);
      await fetchResources();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create resource.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(r: Resource) {
    if (!canEditResource) {
      toast.error("You do not have permission to edit resources.");
      return;
    }

    setEditingId(r.id);
    setEditForm({
      name: r.name || "",
      type: String(r.type ?? 0),
      totalCapacityPercentage: String(r.totalCapacityPercentage ?? 100),
      skillsOrNotes: r.skillsOrNotes || "",
    });
  }

  async function handleUpdate(r: Resource) {
    if (!canEditResource) {
      toast.error("You do not have permission to edit resources.");
      return;
    }

    if (!editForm.name.trim()) {
      toast.error("Resource name is required.");
      return;
    }
    try {
      const full = await resourceService.getById(r.id);
      const payload: ResourceUpdateDTO = {
        id: r.id,
        rowVersion: full.rowVersion || r.rowVersion || "",
        name: editForm.name.trim(),
        type: parseInt(editForm.type, 10),
        totalCapacityPercentage:
          parseFloat(editForm.totalCapacityPercentage) || 100,
        skillsOrNotes: editForm.skillsOrNotes.trim() || undefined,
      };
      await resourceService.update(r.id, payload);
      toast.success("Resource updated.");
      setEditingId(null);
      await fetchResources();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update resource.");
    }
  }

  async function handleDelete(id: string) {
    if (!canDeleteResource) {
      toast.error("You do not have permission to delete resources.");
      return;
    }

    try {
      await resourceService.delete(id);
      toast.success("Resource deleted.");
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete resource.");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const typeColor: Record<number, string> = {
    0: "#0ea5e9",
    1: "#f59e0b",
    2: "#8b5cf6",
    3: "#10b981",
  };

  if (!hasResourcesAccess) {
    return (
      <div className="resources-page">
        <AccessDeniedState
          title="No Resources Access"
          description="You do not have permission to access the resources section."
        />
      </div>
    );
  }

  return (
    <div className="resources-page">
      {/* Hero */}
      <section className="resources-hero">
        <div>
          <p className="resources-kicker">Project Management</p>
          <h1 className="resources-title">Resources</h1>
          <p className="resources-subtitle">
            Manage people, teams, equipment, and other resources available for
            project allocation.
          </p>
        </div>
        <div className="resources-hero-actions">
          {canCreateResource && (
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setShowCreate((prev) => !prev)}
            >
              <i
                className={`bi ${showCreate ? "bi-x-circle" : "bi-plus-lg"} me-2`}
              />
              {showCreate ? "Cancel" : "New Resource"}
            </button>
          )}
        </div>
      </section>

      {/* Create Form */}
      {showCreate && canCreateResource && (
        <section className="resource-form-card mb-3">
          <h3 className="h6 mb-3">Create New Resource</h3>
          <form className="row g-3" onSubmit={handleCreate}>
            <div className="col-12 col-lg-4">
              <label className="form-label">Name *</label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                maxLength={150}
                required
              />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                name="type"
                value={form.type}
                onChange={handleFormChange}
              >
                {Object.entries(ResourceType).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <label className="form-label">Capacity %</label>
              <input
                className="form-control"
                type="number"
                min="0"
                max="100"
                name="totalCapacityPercentage"
                value={form.totalCapacityPercentage}
                onChange={handleFormChange}
              />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Skills / Notes</label>
              <input
                className="form-control"
                name="skillsOrNotes"
                value={form.skillsOrNotes}
                onChange={handleFormChange}
                maxLength={500}
              />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-success"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Resource"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Resource Detail Drawer */}
      {detailResource && (
        <div
          className="resource-detail-backdrop"
          onClick={() => setDetailResource(null)}
        >
          <div
            className="resource-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resource-detail-header">
              <h3>Resource Details</h3>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setDetailResource(null)}
              />
            </div>
            <div className="resource-detail-body">
              <div className="resource-detail-row">
                <span>ID</span>
                <strong>{detailResource.id}</strong>
              </div>
              <div className="resource-detail-row">
                <span>Name</span>
                <strong>{detailResource.name || "N/A"}</strong>
              </div>
              <div className="resource-detail-row">
                <span>Type</span>
                <strong>{ResourceType[detailResource.type ?? 0]}</strong>
              </div>
              <div className="resource-detail-row">
                <span>Capacity</span>
                <strong>{detailResource.totalCapacityPercentage ?? 0}%</strong>
              </div>
              <div className="resource-detail-row">
                <span>Skills / Notes</span>
                <strong>{detailResource.skillsOrNotes || "N/A"}</strong>
              </div>
              <div className="resource-detail-row">
                <span>Created</span>
                <strong>
                  {detailResource.createdDateUtc
                    ? new Date(detailResource.createdDateUtc).toLocaleString()
                    : "N/A"}
                </strong>
              </div>
              <div className="resource-detail-row">
                <span>Updated</span>
                <strong>
                  {detailResource.updatedDateUtc
                    ? new Date(detailResource.updatedDateUtc).toLocaleString()
                    : "N/A"}
                </strong>
              </div>

              {/* Project Requests */}
              <div className="resource-requests-section">
                <h4 className="resource-requests-title">
                  <i className="bi bi-folder2-open me-2" />
                  Project Requests
                </h4>
                {detailRequestsLoading ? (
                  <div className="text-center py-3">
                    <div
                      className="spinner-border spinner-border-sm text-info"
                      role="status"
                    />
                  </div>
                ) : detailRequests.length === 0 ? (
                  <p className="resource-requests-empty">
                    No projects have requested this resource yet.
                  </p>
                ) : (
                  <div className="resource-requests-list">
                    {detailRequests.map((req) => (
                      <div key={req.id} className="resource-request-card">
                        <div className="resource-request-card-header">
                          <span className="resource-request-project-name">
                            {req.projectName}
                          </span>
                          <span
                            className="resource-request-status"
                            style={{
                              background: requestStatusColor[req.status ?? 0],
                            }}
                          >
                            {RequestStatus[req.status ?? 0]}
                          </span>
                        </div>
                        <div className="resource-request-card-body">
                          <div className="resource-request-alloc">
                            <span className="resource-request-alloc-label">
                              Allocation
                            </span>
                            <div className="resource-request-alloc-bar">
                              <div
                                className="resource-request-alloc-fill"
                                style={{
                                  width: `${req.requestedAllocationPercentage ?? 0}%`,
                                }}
                              />
                            </div>
                            <span className="resource-request-alloc-value">
                              {req.requestedAllocationPercentage ?? 0}%
                            </span>
                          </div>
                          {req.comments && (
                            <p className="resource-request-comments">
                              {req.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!canViewResources ? (
        <div className="alert alert-info" role="status">
          <i className="bi bi-info-circle me-2" />
          You can access this section, but you do not have permission to view
          existing resources.
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status" />
          <p className="mt-3 mb-0" style={{ color: "#6c757d" }}>
            Loading resources...
          </p>
        </div>
      ) : resources.length === 0 ? (
        <div className="resources-empty">
          <i className="bi bi-box-seam" />
          <p>No resources found. Create one to get started.</p>
        </div>
      ) : (
        <div className="resources-table-wrap">
          <table className="resources-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Skills / Notes</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) =>
                editingId === r.id ? (
                  <tr key={r.id} className="resource-edit-row">
                    <td>
                      <input
                        className="form-control form-control-sm"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        maxLength={150}
                        required
                      />
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        name="type"
                        value={editForm.type}
                        onChange={handleEditFormChange}
                      >
                        {Object.entries(ResourceType).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        min="0"
                        max="100"
                        name="totalCapacityPercentage"
                        value={editForm.totalCapacityPercentage}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        name="skillsOrNotes"
                        value={editForm.skillsOrNotes}
                        onChange={handleEditFormChange}
                        maxLength={500}
                      />
                    </td>
                    <td>
                      <div className="resource-row-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleUpdate(r)}
                          title="Save"
                        >
                          <i className="bi bi-check-lg" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td>
                      <button
                        type="button"
                        className="resource-name-link"
                        onClick={() => openDetail(r)}
                      >
                        {r.name || "Unnamed"}
                      </button>
                    </td>
                    <td>
                      <span
                        className="resource-type-badge"
                        style={{
                          background: typeColor[r.type ?? 0] || "#6c757d",
                        }}
                      >
                        {ResourceType[r.type ?? 0]}
                      </span>
                    </td>
                    <td>
                      <div className="resource-capacity-bar">
                        <div
                          className="resource-capacity-fill"
                          style={{
                            width: `${r.totalCapacityPercentage ?? 0}%`,
                          }}
                        />
                      </div>
                      <span className="resource-capacity-label">
                        {r.totalCapacityPercentage ?? 0}%
                      </span>
                    </td>
                    <td className="resource-notes-cell">
                      {r.skillsOrNotes || "—"}
                    </td>
                    <td>
                      <div className="resource-row-actions">
                        {confirmDeleteId === r.id ? (
                          <span className="confirm-inline confirm-inline-sm">
                            <span className="confirm-inline-text">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(r.id)}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <>
                            {canEditResource && (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => startEdit(r)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil" />
                              </button>
                            )}
                            {canViewResources && (
                              <button
                                type="button"
                                className="btn btn-outline-info btn-sm"
                                onClick={() => openDetail(r)}
                                title="View"
                              >
                                <i className="bi bi-eye" />
                              </button>
                            )}
                            {canDeleteResource && (
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => setConfirmDeleteId(r.id)}
                                title="Delete"
                              >
                                <i className="bi bi-trash" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Resources;
