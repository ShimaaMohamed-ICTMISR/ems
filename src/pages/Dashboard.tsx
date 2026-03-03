export function Dashboard() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#0f172a' }}>Dashboard</h2>
          <p className="text-muted mb-0">Welcome back! Here's what's happening today.</p>
        </div>
        <button className="btn shadow-sm" style={{ backgroundColor: 'rgb(92, 168, 182)', color: 'white' }}>
          <i className="bi bi-download me-2"></i>
          Export Report
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 stat-card" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #1e40af' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Employees</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>1,234</h2>
                </div>
                <div style={{ backgroundColor: '#e0e7ff', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-people fs-5" style={{ color: '#1e40af' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-arrow-up me-1"></i>
                <small>12% from last month</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 stat-card" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #7c3aed' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Active Projects</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>42</h2>
                </div>
                <div style={{ backgroundColor: '#f3e8ff', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-kanban fs-5" style={{ color: '#7c3aed' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-arrow-up me-1"></i>
                <small>8% from last month</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 stat-card" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #d97706' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Meetings Today</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>8</h2>
                </div>
                <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-calendar-event fs-5" style={{ color: '#d97706' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-dash me-1"></i>
                <small>Same as yesterday</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 stat-card" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #059669' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted text-uppercase small mb-1 fw-semibold">Active Polls</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>5</h2>
                </div>
                <div style={{ backgroundColor: '#d1fae5', borderRadius: '8px', padding: '12px' }}>
                  <i className="bi bi-bar-chart fs-5" style={{ color: '#059669' }}></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-arrow-down me-1"></i>
                <small>3% from last week</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Recent Activity</h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-start mb-3 pb-3 border-bottom">
                <div className="rounded p-2 me-3" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                  <i className="bi bi-person-plus fs-5" style={{ color: '#06b6d4' }}></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-semibold">New employee onboarded</h6>
                  <p className="text-muted small mb-0">John Doe joined the Development team</p>
                  <small className="text-muted">2 hours ago</small>
                </div>
              </div>
              <div className="d-flex align-items-start mb-3 pb-3 border-bottom">
                <div className="rounded p-2 me-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <i className="bi bi-check-circle fs-5" style={{ color: '#10b981' }}></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-semibold">Project milestone completed</h6>
                  <p className="text-muted small mb-0">Project Alpha reached 75% completion</p>
                  <small className="text-muted">5 hours ago</small>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <div className="rounded p-2 me-3" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                  <i className="bi bi-calendar-check fs-5" style={{ color: '#f97316' }}></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-semibold">Meeting scheduled</h6>
                  <p className="text-muted small mb-0">Q1 Review meeting set for tomorrow</p>
                  <small className="text-muted">1 day ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn text-start" style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>
                  <i className="bi bi-person-plus me-2"></i>
                  Add Employee
                </button>
                <button className="btn text-start" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
                  <i className="bi bi-folder-plus me-2"></i>
                  Create Project
                </button>
                <button className="btn text-start" style={{ borderColor: '#f97316', color: '#f97316' }}>
                  <i className="bi bi-calendar-plus me-2"></i>
                  Schedule Meeting
                </button>
                <button className="btn btn-outline-secondary text-start">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Create Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
