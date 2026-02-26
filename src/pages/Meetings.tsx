export function Meetings() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: '#1e293b' }}>Meetings</h2>
          <p className="text-muted mb-0">Schedule and manage meetings across the organization</p>
        </div>
        <button className="btn shadow-sm" style={{ backgroundColor: '#06b6d4', color: 'white' }}>
          <i className="bi bi-plus-circle me-2"></i>
          Schedule Meeting
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header text-white py-3" style={{ backgroundColor: '#06b6d4' }}>
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-calendar-week me-2"></i>
                Upcoming Meetings
              </h5>
            </div>
            <div className="list-group list-group-flush">
              <div className="list-group-item border-0 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-3 flex-grow-1">
                    <div className="rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(6, 182, 212, 0.1)' }}>
                      <div className="text-center">
                        <div className="fw-bold fs-5" style={{ color: '#06b6d4' }}>10</div>
                        <small style={{ color: '#06b6d4' }}>AM</small>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold">Team Standup</h6>
                      <p className="text-muted small mb-2">Daily sync-up with the development team</p>
                      <div className="d-flex gap-3 text-muted small">
                        <span><i className="bi bi-clock me-1"></i>Today, 10:00 AM - 10:30 AM</span>
                        <span><i className="bi bi-people me-1"></i>8 participants</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm shadow-sm" style={{ backgroundColor: '#06b6d4', color: 'white' }}>
                    <i className="bi bi-camera-video me-1"></i>
                    Join
                  </button>
                </div>
              </div>
              
              <div className="list-group-item border-0 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-3 flex-grow-1">
                    <div className="rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                      <div className="text-center">
                        <div className="fw-bold fs-5" style={{ color: '#8b5cf6' }}>2</div>
                        <small style={{ color: '#8b5cf6' }}>PM</small>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold">Project Review</h6>
                      <p className="text-muted small mb-2">Quarterly review of Project Alpha progress</p>
                      <div className="d-flex gap-3 text-muted small">
                        <span><i className="bi bi-clock me-1"></i>Today, 2:00 PM - 3:00 PM</span>
                        <span><i className="bi bi-people me-1"></i>12 participants</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Details
                  </button>
                </div>
              </div>
              
              <div className="list-group-item border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-3 flex-grow-1">
                    <div className="rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
                      <div className="text-center">
                        <div className="fw-bold fs-5" style={{ color: '#f97316' }}>11</div>
                        <small style={{ color: '#f97316' }}>AM</small>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold">Client Presentation</h6>
                      <p className="text-muted small mb-2">Present Q1 results to stakeholders</p>
                      <div className="d-flex gap-3 text-muted small">
                        <span><i className="bi bi-clock me-1"></i>Tomorrow, 11:00 AM - 12:00 PM</span>
                        <span><i className="bi bi-people me-1"></i>15 participants</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3" style={{ color: '#0f172a' }}>
                <i className="bi bi-lightning-charge me-2" style={{ color: '#f97316' }}></i>
                Quick Actions
              </h5>
              <div className="d-grid gap-2">
                <button className="btn text-start" style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>
                  <i className="bi bi-calendar-plus me-2"></i>
                  Schedule Meeting
                </button>
                <button className="btn text-start" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
                  <i className="bi bi-calendar3 me-2"></i>
                  View Calendar
                </button>
                <button className="btn btn-outline-secondary text-start">
                  <i className="bi bi-clock-history me-2"></i>
                  Meeting History
                </button>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3" style={{ color: '#0f172a' }}>
                <i className="bi bi-graph-up me-2" style={{ color: '#10b981' }}></i>
                Meeting Stats
              </h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">This Week</small>
                  <small className="fw-semibold">12 meetings</small>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar" style={{ width: '75%', backgroundColor: '#06b6d4' }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Attendance Rate</small>
                  <small className="fw-semibold">94%</small>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar" style={{ width: '94%', backgroundColor: '#10b981' }}></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Avg Duration</small>
                  <small className="fw-semibold">45 min</small>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div className="progress-bar" style={{ width: '60%', backgroundColor: '#f97316' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
