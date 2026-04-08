import { useState, useEffect } from 'react';
import { permissionService, type Permission } from '../services/permissionService';
import './Permissions.css';

export function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch permissions with pagination
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const response = await permissionService.getPermissionsPaginated({
          category: selectedCategory || undefined,
          pageNumber,
          pageSize,
        });
        setPermissions(response.items || []);
        setTotalPages(response.totalPages);
        setHasMore(response.hasNextPage);
        setError('');
      } catch (err: any) {
        console.error('Error fetching permissions:', err);
        let errorMessage = err.message || 'Failed to load permissions';
        if (errorMessage.includes('403') || errorMessage.includes('Access Denied')) {
          errorMessage = "You don't have permission to view permissions. Contact your administrator.";
        }
        setError(errorMessage);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [pageNumber, pageSize, selectedCategory]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await permissionService.getPermissionCategories();
        setCategories(cats || []);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        let categoryErrorMsg = err.message || 'Failed to load categories';
        if (categoryErrorMsg.includes('403') || categoryErrorMsg.includes('Access Denied')) {
          // Only set error if we don't already have one from permissions fetch
          if (!error) {
            setError("You don't have permission to view permissions. Contact your administrator.");
          }
        }
      }
    };
    fetchCategories();
  }, [error]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setPageNumber(1);
  }, [selectedCategory, pageSize]);

  // Filter permissions based on search (client-side)
  const filteredPermissions = permissions.filter((permission) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      permission.name?.toLowerCase().includes(search) ||
      permission.code?.toLowerCase().includes(search) ||
      permission.description?.toLowerCase().includes(search) ||
      permission.resourceType?.toLowerCase().includes(search) ||
      permission.action?.toLowerCase().includes(search)
    );
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
            <div className="col-md-4">
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

            <div className="col-md-4">
              <label className="form-label fw-bold">Filter by Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Items per page</label>
              <select
                className="form-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <p className="text-muted small mb-0">
          Showing <strong>{filteredPermissions.length}</strong> permissions on page <strong>{pageNumber}</strong> of <strong>{totalPages}</strong>
        </p>
      </div>

      {/* Permissions Table */}
      {filteredPermissions.length > 0 ? (
        <>
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
                    <div className="meta-item">
                      <span className="meta-label">Code:</span>
                      <span className="meta-value">{permission.code}</span>
                    </div>
                    {permission.resourceType && (
                      <div className="meta-item">
                        <span className="meta-label">Resource:</span>
                        <span className="meta-value">{permission.resourceType}</span>
                      </div>
                    )}
                    {permission.action && (
                      <div className="meta-item">
                        <span className="meta-label">Action:</span>
                        <span className="meta-value">{permission.action}</span>
                      </div>
                    )}
                    {permission.isSystemPermission && (
                      <div className="meta-item">
                        <span className="badge bg-warning text-dark">System Permission</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="permission-card-footer">
                  <div className="permission-status">
                    {permission.isActive !== false ? (
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

          {/* Pagination Controls */}
          <div className="pagination-controls mt-4">
            <button
              className="btn btn-secondary"
              onClick={() => setPageNumber(1)}
              disabled={pageNumber === 1 || isLoading}
            >
              First
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber === 1 || isLoading}
            >
              Previous
            </button>
            <span className="page-info">
              Page {pageNumber} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setPageNumber(pageNumber + 1)}
              disabled={!hasMore || isLoading}
            >
              Next
            </button>
          </div>
        </>
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