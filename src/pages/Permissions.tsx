import { useState, useEffect } from 'react';
import { permissionService, type Permission } from '../services/permissionService';
import './Permissions.css';

export function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Fetch all permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const data = await permissionService.getAllPermissions();
        setPermissions(data);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load permissions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Filter permissions based on search and status
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterActive === null || permission.isActive === filterActive;

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="permissions-container">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="permissions-container">
      {/* Header */}
      <div className="permissions-header">
        <div>
          <h2 className="mb-2 fw-bold">Permissions</h2>
          <p className="text-muted">Manage system permissions and access controls</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Search Permissions</label>
              <div className="position-relative">
                <i className="bi bi-search position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Filter by Status</label>
              <select
                className="form-select"
                value={filterActive === null ? '' : filterActive ? 'active' : 'inactive'}
                onChange={(e) => {
                  if (e.target.value === '') setFilterActive(null);
                  else setFilterActive(e.target.value === 'active');
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-3">
        <p className="text-muted small">
          Showing <strong>{filteredPermissions.length}</strong> of <strong>{permissions.length}</strong> permissions
        </p>
      </div>

      {/* Permissions Table */}
      {filteredPermissions.length > 0 ? (
        <div className="permissions-grid">
          {filteredPermissions.map((permission) => (
            <div key={permission.id} className="permission-card">
              <div className="permission-card-header">
                <div className="permission-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <div className="permission-title-section">
                  <h5 className="permission-title">{permission.name}</h5>
                  {permission.category && (
                    <span className="badge bg-info text-dark small">{permission.category}</span>
                  )}
                </div>
              </div>

              <div className="permission-card-body">
                <div className="permission-meta">
                  {permission.action && (
                    <div className="meta-item">
                      <span className="meta-label">Action:</span>
                      <span className="meta-value">{permission.action}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="permission-card-footer">
                <div className="permission-status">
                  {permission.isActive ? (
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i>Active
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      <i className="bi bi-x-circle me-1"></i>Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card shadow-sm text-center py-5">
          <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }}></i>
          <h5 className="text-muted">No permissions found</h5>
          <p className="text-muted small">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
