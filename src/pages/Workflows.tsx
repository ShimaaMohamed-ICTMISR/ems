export function Workflows() {
  return (
    <div>
      <h2 className="mb-4">Workflows</h2>
      <p className="lead">Automate and manage business processes.</p>
      <div className="row g-4 mt-3">
        <div className="col-lg-4">
          <div className="card border-primary">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-check-circle me-2"></i>
                Active Workflows
              </h5>
            </div>
            <div className="card-body">
              <h3 className="display-4">12</h3>
              <p className="text-muted mb-0">Currently running</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-warning">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-pause-circle me-2"></i>
                Pending Approval
              </h5>
            </div>
            <div className="card-body">
              <h3 className="display-4">5</h3>
              <p className="text-muted mb-0">Awaiting action</p>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-success">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Completed
              </h5>
            </div>
            <div className="card-body">
              <h3 className="display-4">248</h3>
              <p className="text-muted mb-0">This month</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h4>Recent Workflows</h4>
        <div className="list-group">
          <div className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Employee Onboarding</h6>
                <small className="text-muted">Started 2 hours ago</small>
              </div>
              <span className="badge bg-primary">In Progress</span>
            </div>
          </div>
          <div className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Purchase Order Approval</h6>
                <small className="text-muted">Started 1 day ago</small>
              </div>
              <span className="badge bg-warning">Pending</span>
            </div>
          </div>
          <div className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Leave Request Processing</h6>
                <small className="text-muted">Completed 3 days ago</small>
              </div>
              <span className="badge bg-success">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
