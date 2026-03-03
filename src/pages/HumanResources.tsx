export function HumanResources() {
  return (
    <div>
      <h2 className="mb-4">Human Resources</h2>
      <p className="lead">Manage employee records, attendance, payroll, and HR workflows.</p>
      <div className="row g-3 mt-3">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-person-badge me-2"></i>
                Employee Directory
              </h5>
              <p className="card-text">View and manage employee profiles.</p>
              <button className="btn btn-primary btn-sm">Open</button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-calendar-check me-2"></i>
                Attendance
              </h5>
              <p className="card-text">Track employee attendance and leaves.</p>
              <button className="btn btn-primary btn-sm">Open</button>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-cash-stack me-2"></i>
                Payroll
              </h5>
              <p className="card-text">Process payroll and manage compensation.</p>
              <button className="btn btn-primary btn-sm">Open</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
