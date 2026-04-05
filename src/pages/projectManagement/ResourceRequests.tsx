import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AccessDeniedState } from "../../Components/AccessDeniedState";
import {
  PM_PERMISSION_KEYS,
  PM_ROUTE_PERMISSION_KEYS,
} from "../../config/projectManagementPermissions";
import { useProjectManagementPermissions } from "../../hooks/useProjectManagementPermissions";
import {
  resourceRequestService,
  resourceService,
  type ResourceRequest,
  type Resource,
} from "../../services/projectManagementServices/resourceService";
import projectService, {
  type Project,
} from "../../services/projectManagementServices/projectService";
import { ResourceType, RequestStatus } from "../../config/enums";
import ".././styles/ResourceRequests.css";

const statusColor: Record<number, string> = {
  0: "#3b82f6", // Requested
  1: "#f59e0b", // Pending Approval
  2: "#22c55e", // Allocated
  3: "#ef4444", // Declined
  4: "#6b7280", // Cancelled
};

const typeColor: Record<number, string> = {
  0: "#0ea5e9",
  1: "#f59e0b",
  2: "#8b5cf6",
  3: "#10b981",
};

export function ResourceRequests() {
  const { canAny } = useProjectManagementPermissions();

  const hasResourceRequestsAccess = canAny([
    ...PM_ROUTE_PERMISSION_KEYS.RESOURCE_REQUESTS,
  ]);
  const canViewRequests = canAny([...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.VIEW]);
  const canApproveOrReject =
    canAny([...PM_PERMISSION_KEYS.APPROVALS.RESOURCE_REQUESTS]) ||
    canAny([...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.EDIT]);
  const canDeleteRequests = canAny([
    ...PM_PERMISSION_KEYS.RESOURCES.REQUESTS.DELETE,
  ]);

  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Approve / Reject
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );
  const [actionComments, setActionComments] = useState("");
  const [actioning, setActioning] = useState(false);

  // Detail drawer
  const [detailRequest, setDetailRequest] = useState<ResourceRequest | null>(
    null,
  );

  useEffect(() => {
    if (!hasResourceRequestsAccess) {
      setLoading(false);
      return;
    }

    fetchAll();
  }, [hasResourceRequestsAccess, canViewRequests]);

  async function fetchAll() {
    if (!canViewRequests) {
      setRequests([]);
      setResources([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [reqData, resData, projData] = await Promise.all([
        resourceRequestService.getAll(),
        resourceService.getAll(),
        projectService.getProjects(),
      ]);
      setRequests(reqData);
      setResources(resData);
      setProjects(projData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load resource requests.");
    } finally {
      setLoading(false);
    }
  }

  function startAction(id: string, type: "approve" | "reject") {
    setActionId(id);
    setActionType(type);
    setActionComments("");
  }

  function cancelAction() {
    setActionId(null);
    setActionType(null);
    setActionComments("");
  }

  async function submitAction() {
    if (!canApproveOrReject) {
      toast.error("You do not have permission to approve or reject requests.");
      return;
    }

    if (!actionId || !actionType) return;
    try {
      setActioning(true);
      const status = actionType === "approve" ? 2 : 3; // Allocated | Declined
      await resourceRequestService.approve(actionId, {
        status,
        comments: actionComments || undefined,
      });
      toast.success(
        actionType === "approve" ? "Request approved!" : "Request declined.",
      );
      cancelAction();
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast.error("Action failed.");
    } finally {
      setActioning(false);
    }
  }

  async function handleDelete(id: string) {
    if (!canDeleteRequests) {
      toast.error("You do not have permission to delete requests.");
      return;
    }

    try {
      await resourceRequestService.delete(id);
      toast.success("Request deleted.");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete request.");
    }
  }

  function getResourceName(resourceId?: string | null) {
    if (!resourceId) return "—";
    const r = resources.find((res) => res.id === resourceId);
    return r?.name || resourceId;
  }

  function getProjectName(projectId?: string | null) {
    if (!projectId) return "—";
    const p = projects.find((proj) => proj.id === projectId);
    return p?.name || projectId;
  }

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!hasResourceRequestsAccess) {
    return (
      <div className="rr-page">
        <AccessDeniedState
          title="No Resource Requests Access"
          description="You do not have permission to access resource requests."
        />
      </div>
    );
  }

  return (
    <div className="rr-page">
      {/* Hero */}
      <div className="rr-hero">
        <div>
          <p className="rr-kicker">Project Management</p>
          <h1 className="rr-title">Resource Requests</h1>
          <p className="rr-subtitle">
            Manage, approve, and track all resource allocation requests.
          </p>
        </div>
      </div>

      {/* Table */}
      {!canViewRequests ? (
        <div className="alert alert-info" role="status">
          <i className="bi bi-info-circle me-2" />
          You can access this module, but you do not have permission to view
          resource requests.
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rr-empty">
          <i className="bi bi-inbox" />
          No resource requests found.
        </div>
      ) : (
        <div className="rr-table-wrap">
          <table className="rr-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Allocation</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Requested</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <button
                      type="button"
                      className="rr-name-link"
                      onClick={() => setDetailRequest(req)}
                    >
                      {getResourceName(req.resourceId)}
                    </button>
                  </td>
                  <td>
                    <span
                      className="rr-type-badge"
                      style={{ background: typeColor[req.resourceType ?? 0] }}
                    >
                      {ResourceType[req.resourceType ?? 0] || "Unknown"}
                    </span>
                  </td>
                  <td>{req.requestedAllocationPercentage ?? 0}%</td>
                  <td>
                    <span
                      className="rr-status-badge"
                      style={{ background: statusColor[req.status ?? 0] }}
                    >
                      {RequestStatus[req.status ?? 0] || "Unknown"}
                    </span>
                  </td>
                  <td className="rr-comments-cell">{req.comments || "—"}</td>
                  <td>
                    {req.createdDateUtc
                      ? new Date(req.createdDateUtc).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    {actionId === req.id ? (
                      <div className="rr-action-inline">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Comments (optional)"
                          value={actionComments}
                          onChange={(e) => setActionComments(e.target.value)}
                          style={{ maxWidth: 140 }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={submitAction}
                          disabled={actioning}
                        >
                          <i className="bi bi-check-lg" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={cancelAction}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ) : confirmDeleteId === req.id ? (
                      <span className="rr-action-inline">
                        <span style={{ fontSize: "0.78rem", color: "#f87171" }}>
                          Delete?
                        </span>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            handleDelete(req.id);
                            setConfirmDeleteId(null);
                          }}
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
                      <div className="rr-row-actions">
                        {canApproveOrReject &&
                          (req.status === 0 || req.status === 1) && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              onClick={() => startAction(req.id, "approve")}
                              title="Approve"
                            >
                              <i className="bi bi-check-circle" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => startAction(req.id, "reject")}
                              title="Reject"
                            >
                              <i className="bi bi-x-circle" />
                            </button>
                          </>
                          )}
                        <button
                          type="button"
                          className="btn btn-outline-light btn-sm"
                          onClick={() => setDetailRequest(req)}
                          title="View"
                        >
                          <i className="bi bi-eye" />
                        </button>
                        {canDeleteRequests && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setConfirmDeleteId(req.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {detailRequest && (
        <div
          className="rr-detail-backdrop"
          onClick={() => setDetailRequest(null)}
        >
          <div
            className="rr-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rr-detail-header">
              <h3>Request Details</h3>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                onClick={() => setDetailRequest(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="rr-detail-body">
              <div className="rr-detail-row">
                <span>ID</span>
                <strong>{detailRequest.id}</strong>
              </div>
              <div className="rr-detail-row">
                <span>Project</span>
                <strong>{getProjectName(detailRequest.projectId)}</strong>
              </div>
              <div className="rr-detail-row">
                <span>Resource</span>
                <strong>{getResourceName(detailRequest.resourceId)}</strong>
              </div>
              <div className="rr-detail-row">
                <span>Type</span>
                <strong>
                  <span
                    className="rr-type-badge text-dark"
                    style={{
                      background: typeColor[detailRequest.resourceType ?? 0],
                    }}
                  >
                    {ResourceType[detailRequest.resourceType ?? 0]}
                  </span>
                </strong>
              </div>
              <div className="rr-detail-row">
                <span>Allocation</span>
                <strong>
                  {detailRequest.requestedAllocationPercentage ?? 0}%
                </strong>
              </div>
              <div className="rr-detail-row">
                <span>Status</span>
                <strong>
                  <span
                    className="rr-status-badge text-dark"
                    style={{
                      background: statusColor[detailRequest.status ?? 0],
                    }}
                  >
                    {RequestStatus[detailRequest.status ?? 0]}
                  </span>
                </strong>
              </div>
              <div className="rr-detail-row">
                <span>Comments</span>
                <strong>{detailRequest.comments || "—"}</strong>
              </div>
              <div className="rr-detail-row">
                <span>Approved By</span>
                <strong>{detailRequest.approvedBy || "—"}</strong>
              </div>
              <div className="rr-detail-row">
                <span>Decided At</span>
                <strong>
                  {detailRequest.decidedAtUtc
                    ? new Date(detailRequest.decidedAtUtc).toLocaleString()
                    : "—"}
                </strong>
              </div>
              <div className="rr-detail-row">
                <span>Created</span>
                <strong>
                  {detailRequest.createdDateUtc
                    ? new Date(detailRequest.createdDateUtc).toLocaleString()
                    : "—"}
                </strong>
              </div>
              <div className="rr-detail-row">
                <span>Updated</span>
                <strong>
                  {detailRequest.updatedDateUtc
                    ? new Date(detailRequest.updatedDateUtc).toLocaleString()
                    : "—"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceRequests;
