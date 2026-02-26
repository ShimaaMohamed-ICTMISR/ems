export function Settings() {
  return (
    <div>
      <h2 className="mb-4">Settings</h2>
      <p className="lead">Configure system preferences and user settings.</p>
      <div className="row g-4 mt-3">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">General Settings</h5>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="companyName" className="form-label">Company Name</label>
                  <input type="text" className="form-control" id="companyName" defaultValue="Enterprise Corp" />
                </div>
                <div className="mb-3">
                  <label htmlFor="timezone" className="form-label">Timezone</label>
                  <select className="form-select" id="timezone">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Tokyo</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="language" className="form-label">Language</label>
                  <select className="form-select" id="language">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="notifications" defaultChecked />
                  <label className="form-check-label" htmlFor="notifications">
                    Enable email notifications
                  </label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="darkMode" />
                  <label className="form-check-label" htmlFor="darkMode">
                    Dark mode
                  </label>
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Links</h5>
            </div>
            <div className="list-group list-group-flush">
              <a href="#" className="list-group-item list-group-item-action">
                <i className="bi bi-shield-lock me-2"></i>
                Security Settings
              </a>
              <a href="#" className="list-group-item list-group-item-action">
                <i className="bi bi-person me-2"></i>
                User Management
              </a>
              <a href="#" className="list-group-item list-group-item-action">
                <i className="bi bi-database me-2"></i>
                Backup & Restore
              </a>
              <a href="#" className="list-group-item list-group-item-action">
                <i className="bi bi-info-circle me-2"></i>
                About
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
