import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { AccessDeniedState } from "../../../Components/AccessDeniedState";
import { RequestStatus, ResourceType } from "../../../config/enums";
import type {
  Resource,
  ResourceRequest,
} from "../../../services/projectManagementServices/resourceService";

type ResourceRequestFormState = {
  resourceId: string;
  resourceType: string;
  requestedAllocationPercentage: string;
  comments: string;
};

type ProjectResourcesTabProps = {
  canCreateResourceRequests: boolean;
  showCreateResourceReq: boolean;
  setShowCreateResourceReq: Dispatch<SetStateAction<boolean>>;
  canViewResourceRequests: boolean;
  handleCreateResourceReq: (event: FormEvent) => void;
  newResourceReq: ResourceRequestFormState;
  handleNewResourceReqChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  creatingResourceReq: boolean;
  canViewResources: boolean;
  allResources: Resource[];
  resourceRequestsLoading: boolean;
  resourceRequests: ResourceRequest[];
  getResourceName: (resourceId?: string | null) => string;
  resourceTypeColor: Record<number, string>;
  requestStatusColor: Record<number, string>;
  canDeleteResourceRequests: boolean;
  confirmDeleteReqId: string | null;
  handleDeleteResourceReq: (id: string) => void;
  setConfirmDeleteReqId: Dispatch<SetStateAction<string | null>>;
};

export function ProjectResourcesTab({
  canCreateResourceRequests,
  showCreateResourceReq,
  setShowCreateResourceReq,
  canViewResourceRequests,
  handleCreateResourceReq,
  newResourceReq,
  handleNewResourceReqChange,
  creatingResourceReq,
  canViewResources,
  allResources,
  resourceRequestsLoading,
  resourceRequests,
  getResourceName,
  resourceTypeColor,
  requestStatusColor,
  canDeleteResourceRequests,
  confirmDeleteReqId,
  handleDeleteResourceReq,
  setConfirmDeleteReqId,
}: ProjectResourcesTabProps) {
  return (
    <section className="tasks-section">
      <div className="tasks-section-header">
        <h2>
          <i className="bi bi-box-seam me-2" />
          Resources
        </h2>
        {canCreateResourceRequests && (
          <button
            type="button"
            className="btn btn-info text-white btn-sm"
            onClick={() => setShowCreateResourceReq((prev) => !prev)}
          >
            <i
              className={`bi ${showCreateResourceReq ? "bi-x-circle" : "bi-plus-lg"} me-1`}
            />
            {showCreateResourceReq ? "Cancel" : "Request Resource"}
          </button>
        )}
      </div>

      {!canViewResourceRequests ? (
        <AccessDeniedState
          title="Resource requests are restricted"
          description="You can access this tab, but your role does not include Resources.Requests.View to display requests."
        />
      ) : null}

      {canCreateResourceRequests && showCreateResourceReq && (
        <div className="task-create-card">
          <h3 className="h6 mb-3">Request a Resource</h3>
          <form className="row g-3" onSubmit={handleCreateResourceReq}>
            <div className="col-12 col-md-4">
              <label className="form-label">Resource</label>
              {canViewResources ? (
                <select
                  className="form-select"
                  name="resourceId"
                  value={newResourceReq.resourceId}
                  onChange={handleNewResourceReqChange}
                >
                  <option value="">— None —</option>
                  {allResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.id}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="alert alert-light border mb-0 py-2 px-3"
                  role="status"
                >
                  <i className="bi bi-shield-lock me-2" />
                  Resource list is hidden because Resources.View is not granted.
                </div>
              )}
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Resource Type</label>
              <select
                className="form-select"
                name="resourceType"
                value={newResourceReq.resourceType}
                onChange={handleNewResourceReqChange}
                disabled={canViewResources && !!newResourceReq.resourceId}
              >
                {Object.entries(ResourceType).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Allocation %</label>
              <input
                className="form-control"
                type="number"
                name="requestedAllocationPercentage"
                value={newResourceReq.requestedAllocationPercentage}
                onChange={handleNewResourceReqChange}
                min={0}
                max={100}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Comments</label>
              <textarea
                className="form-control"
                rows={2}
                name="comments"
                value={newResourceReq.comments}
                onChange={handleNewResourceReqChange}
                maxLength={500}
              />
            </div>
            <div className="col-12 text-end">
              <button
                type="submit"
                className="btn btn-success"
                disabled={creatingResourceReq}
              >
                {creatingResourceReq ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {canViewResourceRequests && resourceRequestsLoading ? (
        <div className="text-center py-4">
          <div
            className="spinner-border spinner-border-sm text-info"
            role="status"
          />
        </div>
      ) : canViewResourceRequests && resourceRequests.length === 0 ? (
        <div className="tasks-table-wrap">
          <div className="tasks-empty-message">
            <i className="bi bi-inbox" />
            No resource requests yet. Click "Request Resource" to add one.
          </div>
        </div>
      ) : canViewResourceRequests ? (
        <div className="tasks-table-wrap">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Allocation</th>
                <th>Status</th>
                <th>Comments</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resourceRequests.map((req) => (
                <tr key={req.id}>
                  <td>
                    {canViewResources ? (
                      getResourceName(req.resourceId)
                    ) : (
                      <span className="text-muted">
                        <i className="bi bi-shield-lock me-1" />
                        Restricted
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className="task-row-badge"
                      style={{
                        background: resourceTypeColor[req.resourceType ?? 0],
                      }}
                    >
                      {ResourceType[req.resourceType ?? 0] || "Unknown"}
                    </span>
                  </td>
                  <td>{req.requestedAllocationPercentage ?? 0}%</td>
                  <td>
                    <span
                      className="task-row-badge"
                      style={{
                        background: requestStatusColor[req.status ?? 0],
                      }}
                    >
                      {RequestStatus[req.status ?? 0] || "Unknown"}
                    </span>
                  </td>
                  <td className="phase-deliverables-cell">
                    {req.comments || "—"}
                  </td>
                  <td>
                    <div className="task-row-actions">
                      {canDeleteResourceRequests &&
                        (confirmDeleteReqId === req.id ? (
                          <span className="confirm-inline confirm-inline-sm">
                            <span className="confirm-inline-text">Delete?</span>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteResourceReq(req.id)}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setConfirmDeleteReqId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setConfirmDeleteReqId(req.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
