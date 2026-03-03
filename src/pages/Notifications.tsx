export function Notifications() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#1e293b' }}>Notifications</h2>
          <p className="text-muted mb-0">Stay updated with your latest activities</p>
        </div>
        <button className="btn btn-outline-primary btn-sm">
          <i className="bi bi-check-all me-2"></i>
          Mark all as read
        </button>
      </div>
      
      <div className="list-group shadow-sm">
        <div className="list-group-item list-group-item-action border-0 border-start border-4 mb-2" style={{ borderColor: '#06b6d4 !important' }}>
          <div className="d-flex w-100 justify-content-between align-items-start">
            <div className="d-flex gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', minWidth: '48px', backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                <i className="bi bi-folder-plus fs-5" style={{ color: '#06b6d4' }}></i>
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">New project assigned</h6>
                <p className="mb-1 text-muted">You have been assigned to Project Alpha. Check the details and start working on your tasks.</p>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  3 mins ago
                </small>
              </div>
            </div>
            <span className="badge" style={{ backgroundColor: '#06b6d4' }}>New</span>
          </div>
        </div>
        
        <div className="list-group-item list-group-item-action border-0 border-start border-4 mb-2" style={{ borderColor: '#f97316 !important' }}>
          <div className="d-flex w-100 justify-content-between align-items-start">
            <div className="d-flex gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', minWidth: '48px', backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                <i className="bi bi-calendar-event fs-5" style={{ color: '#f97316' }}></i>
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">Meeting reminder</h6>
                <p className="mb-1 text-muted">Team standup meeting starts in 30 minutes. Join the video call on time.</p>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  1 hour ago
                </small>
              </div>
            </div>
          </div>
        </div>
        
        <div className="list-group-item list-group-item-action border-0 border-start border-4 mb-2" style={{ borderColor: '#8b5cf6 !important' }}>
          <div className="d-flex w-100 justify-content-between align-items-start">
            <div className="d-flex gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', minWidth: '48px', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                <i className="bi bi-bar-chart fs-5" style={{ color: '#8b5cf6' }}></i>
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">Poll closing soon</h6>
                <p className="mb-1 text-muted">Office renovation poll closes today at 5 PM. Cast your vote now!</p>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  2 hours ago
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="list-group-item list-group-item-action border-0 border-start border-4" style={{ borderColor: '#10b981 !important' }}>
          <div className="d-flex w-100 justify-content-between align-items-start">
            <div className="d-flex gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', minWidth: '48px', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <i className="bi bi-check-circle fs-5" style={{ color: '#10b981' }}></i>
              </div>
              <div>
                <h6 className="mb-1 fw-semibold">Task completed</h6>
                <p className="mb-1 text-muted">Your submitted report has been approved by the manager.</p>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  5 hours ago
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
