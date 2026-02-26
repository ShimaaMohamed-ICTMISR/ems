export function AuditLog() {
  return (
    <div>
      <h2 className="mb-4">Audit Log</h2>
      <p className="lead">Track all system activities and changes.</p>
      <div className="table-responsive mt-4">
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-02-25 09:15:23</td>
              <td>admin@company.com</td>
              <td>UPDATE</td>
              <td>Employee Record #1234</td>
              <td><span className="badge bg-success">Success</span></td>
            </tr>
            <tr>
              <td>2026-02-25 09:10:45</td>
              <td>hr@company.com</td>
              <td>CREATE</td>
              <td>New Project: Beta</td>
              <td><span className="badge bg-success">Success</span></td>
            </tr>
            <tr>
              <td>2026-02-25 09:05:12</td>
              <td>user@company.com</td>
              <td>DELETE</td>
              <td>Meeting #567</td>
              <td><span className="badge bg-success">Success</span></td>
            </tr>
            <tr>
              <td>2026-02-25 08:58:33</td>
              <td>admin@company.com</td>
              <td>LOGIN</td>
              <td>System Access</td>
              <td><span className="badge bg-success">Success</span></td>
            </tr>
            <tr>
              <td>2026-02-25 08:45:21</td>
              <td>guest@company.com</td>
              <td>LOGIN</td>
              <td>System Access</td>
              <td><span className="badge bg-danger">Failed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
