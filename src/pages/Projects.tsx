export function Projects() {
  return (
    <div>
      <h2 className="mb-4">Projects</h2>
      <p className="lead">Manage and track all organizational projects.</p>
      <div className="table-responsive mt-4">
        <table className="table table-hover">
          <thead className="table-dark">
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Due Date</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Project Alpha</td>
              <td><span className="badge bg-success">Active</span></td>
              <td>
                <div className="progress" style={{ height: '20px' }}>
                  <div className="progress-bar" role="progressbar" style={{ width: '75%' }} aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}>75%</div>
                </div>
              </td>
              <td>2026-03-15</td>
              <td>5 members</td>
            </tr>
            <tr>
              <td>Project Beta</td>
              <td><span className="badge bg-warning">Planning</span></td>
              <td>
                <div className="progress" style={{ height: '20px' }}>
                  <div className="progress-bar bg-warning" role="progressbar" style={{ width: '25%' }} aria-valuenow={25} aria-valuemin={0} aria-valuemax={100}>25%</div>
                </div>
              </td>
              <td>2026-04-01</td>
              <td>3 members</td>
            </tr>
            <tr>
              <td>Project Gamma</td>
              <td><span className="badge bg-info">Review</span></td>
              <td>
                <div className="progress" style={{ height: '20px' }}>
                  <div className="progress-bar bg-info" role="progressbar" style={{ width: '90%' }} aria-valuenow={90} aria-valuemin={0} aria-valuemax={100}>90%</div>
                </div>
              </td>
              <td>2026-02-28</td>
              <td>8 members</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
