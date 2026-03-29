export function Dashboard() {
  return (
    <div className="dashboard-page container-fluid py-4" style={{ backgroundColor: '#f8fbff' }}>
      {/* Header Section - matching Opportunities page */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            }}
          >
            <i className="bi bi-speedometer2 text-white fs-4" />
          </div>
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: '#1f2937' }}>Dashboard</h2>
            <p className="mb-0" style={{ color: '#6b7280' }}>
              Welcome back! Here's what's happening today.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-dashboard-primary btn-lg"
          >
            <i className="bi bi-download me-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#6b7280' }}>
                    Employees
                  </h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#1f2937' }}>
                    1,234
                  </h2>
                </div>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                  }}
                >
                  <i className="bi bi-people text-white fs-5"></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#10b981' }}>
                <i className="bi bi-arrow-up me-2" style={{ fontSize: '0.8rem' }}></i>
                <small className="fw-medium">12% from last month</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#6b7280' }}>
                    Active Projects
                  </h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#1f2937' }}>
                    42
                  </h2>
                </div>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                  }}
                >
                  <i className="bi bi-kanban text-white fs-5"></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#10b981' }}>
                <i className="bi bi-arrow-up me-2" style={{ fontSize: '0.8rem' }}></i>
                <small className="fw-medium">8% from last month</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#6b7280' }}>
                    Meetings Today
                  </h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#1f2937' }}>
                    8
                  </h2>
                </div>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  }}
                >
                  <i className="bi bi-calendar-event text-white fs-5"></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#6b7280' }}>
                <i className="bi bi-dash me-2" style={{ fontSize: '0.8rem' }}></i>
                <small className="fw-medium">Same as yesterday</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-uppercase small mb-2 fw-semibold" style={{ color: '#6b7280' }}>
                    Active Polls
                  </h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#1f2937' }}>
                    5
                  </h2>
                </div>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                >
                  <i className="bi bi-bar-chart text-white fs-5"></i>
                </div>
              </div>
              <div className="d-flex align-items-center" style={{ color: '#ef4444' }}>
                <i className="bi bi-arrow-down me-2" style={{ fontSize: '0.8rem' }}></i>
                <small className="fw-medium">3% from last week</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: '#1f2937' }}>Recent Activity</h5>
                <small style={{ color: '#6b7280' }}>Latest updates from your team</small>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="p-4">
                <div className="d-flex align-items-start mb-4 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
                    }}
                  >
                    <i className="bi bi-person-plus text-white" style={{ fontSize: '1rem' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold" style={{ color: '#1f2937' }}>New employee onboarded</div>
                    <small className="d-block" style={{ color: '#6b7280' }}>John Doe joined the Development team</small>
                    <small style={{ color: '#9ca3af' }}>2 hours ago</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-start mb-4 pb-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }}
                  >
                    <i className="bi bi-check-circle text-white" style={{ fontSize: '1rem' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold" style={{ color: '#1f2937' }}>Project milestone completed</div>
                    <small className="d-block" style={{ color: '#6b7280' }}>Project Alpha reached 75% completion</small>
                    <small style={{ color: '#9ca3af' }}>5 hours ago</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    }}
                  >
                    <i className="bi bi-calendar-check text-white" style={{ fontSize: '1rem' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold" style={{ color: '#1f2937' }}>Meeting scheduled</div>
                    <small className="d-block" style={{ color: '#6b7280' }}>Q1 Review meeting set for tomorrow</small>
                    <small style={{ color: '#9ca3af' }}>1 day ago</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#ffffff' }}>
              <div>
                <h5 className="mb-1 fw-bold" style={{ color: '#1f2937' }}>Quick Actions</h5>
                <small style={{ color: '#6b7280' }}>Common tasks and shortcuts</small>
              </div>
            </div>
            <div className="card-body">
              <div className="d-grid gap-3">
                <button className="btn btn-dashboard-outline text-start">
                  <i className="bi bi-person-plus me-2"></i>
                  Add Employee
                </button>
                
                <button className="btn btn-dashboard-outline text-start">
                  <i className="bi bi-folder-plus me-2"></i>
                  Create Project
                </button>
                
                <button className="btn btn-dashboard-outline text-start">
                  <i className="bi bi-calendar-plus me-2"></i>
                  Schedule Meeting
                </button>
                
                <button className="btn btn-dashboard-primary text-start">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Create Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Dashboard specific styles with proper colors */
        .dashboard-page .card {
          border-radius: 12px !important;
          border: 1px solid rgba(226, 232, 240, 0.9) !important;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06) !important;
        }

        .dashboard-page .card-header {
          background: #ffffff !important;
          background-color: #ffffff !important;
          background-image: none !important;
          border-bottom: 1px solid #eef2f7 !important;
          border-radius: 12px 12px 0 0 !important;
        }

        .dashboard-page h5,
        .dashboard-page h6 {
          color: #0f172a !important;
        }

        .dashboard-page small {
          color: #64748b;
        }

        .btn-dashboard-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
          border: none !important;
          color: #ffffff !important;
          border-radius: 8px !important;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        .btn-dashboard-primary:hover {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.35) !important;
          color: #ffffff !important;
        }

        .btn-dashboard-outline {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
          border-radius: 8px !important;
          font-weight: 500;
          transition: all 0.2s ease !important;
        }

        .btn-dashboard-outline:hover {
          background: #f8fbff !important;
          border-color: #06b6d4 !important;
          color: #06b6d4 !important;
          transform: translateY(-1px) !important;
        }
      `}</style>
    </div>
  );
}