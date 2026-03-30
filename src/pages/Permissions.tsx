import { useState, useEffect } from 'react';
import hrService from '../services/hrProjectManagementService';
import type { Employee } from '../services/hrProjectManagementService';
import './Permissions.css';

interface HrPermissionEntry {
  permissionCode: string;
  source?: string;
}

export function Permissions() {
  // HR Permissions list
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // User permissions management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userPermissions, setUserPermissions] = useState<HrPermissionEntry[]>([]);
  const [loadingUserPerms, setLoadingUserPerms] = useState(false);
  const [newPermissionCode, setNewPermissionCode] = useState('');
  const [assigningUserPerm, setAssigningUserPerm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'user'>('all');

  // User permission sections
  const [permSections, setPermSections] = useState<any>(null);
  const [loadingSections, setLoadingSections] = useState(false);

  // Fetch all HR permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const response = await hrService.getHrPermissions();
        const data = response.data?.data || response.data;
        const perms = data?.permissions || data || [];
        setAllPermissions(Array.isArray(perms) ? perms : []);
        setError('');
      } catch (err: any) {
        console.error('Error fetching HR permissions:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load permissions');
        setAllPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  // Fetch employees for dropdown
  useEffect(() => {
    hrService.getEmployees({ limit: 100 })
      .then(res => {
        const list = res.data?.data || res.data || [];
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(err => console.error('Error loading employees:', err));
  }, []);

  // Load user permission sections
  const loadUserSections = async (userId: string) => {
    if (!userId) return;
    setLoadingSections(true);
    try {
      const res = await hrService.getUserPermissionSections(userId);
      const data = res.data?.data || res.data;
      setPermSections(data);
    } catch (err) {
      console.error('Error loading user sections:', err);
      setPermSections(null);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setUserPermissions([]);
      setPermSections(null);
      return;
    }
    setLoadingUserPerms(true);
    try {
      await loadUserSections(userId);
    } catch (err) {
      console.error('Error loading user permissions:', err);
    } finally {
      setLoadingUserPerms(false);
    }
  };

  const handleAssignUserPermission = async () => {
    if (!selectedUserId || !newPermissionCode) return;
    setAssigningUserPerm(true);
    try {
      await hrService.assignUserPermission(selectedUserId, { permissionCode: newPermissionCode });
      setNewPermissionCode('');
      // Refresh sections
      await loadUserSections(selectedUserId);
    } catch (err: any) {
      console.error('Error assigning permission:', err);
      alert(err.response?.data?.message || 'Failed to assign permission');
    } finally {
      setAssigningUserPerm(false);
    }
  };

  const handleRemoveUserPermission = async (permissionCode: string) => {
    if (!selectedUserId) return;
    try {
      await hrService.removeUserPermission(selectedUserId, permissionCode);
      await loadUserSections(selectedUserId);
    } catch (err: any) {
      console.error('Error removing permission:', err);
      alert(err.response?.data?.message || 'Failed to remove permission');
    }
  };

  // Filter all permissions
  const filteredPermissions = allPermissions.filter((perm) => {
    if (!searchTerm) return true;
    return perm.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group permissions by prefix (e.g. "Tasks.Create" -> "Tasks")
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const parts = perm.split('.');
    const group = parts.length > 1 ? parts[0] : 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {} as Record<string, string[]>);

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
          <h2 className="mb-2 fw-bold">
            <i className="bi bi-shield-lock me-2" style={{ color: '#0ea5e9' }}></i>
            Permissions
          </h2>
          <p className="text-muted">Manage HR service permissions and user access controls</p>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('all')}
          style={{ borderRadius: '8px 0 0 8px', padding: '0.6rem 1.5rem', fontWeight: 600 }}
        >
          <i className="bi bi-list-check me-2"></i>
          All Permissions
          <span style={{ marginLeft: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{allPermissions.length}</span>
        </button>
        <button
          className={`btn ${activeTab === 'user' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setActiveTab('user')}
          style={{ borderRadius: '0 8px 8px 0', padding: '0.6rem 1.5rem', fontWeight: 600 }}
        >
          <i className="bi bi-person-badge me-2"></i>
          User Permissions
        </button>
      </div>

      {/* All Permissions Tab */}
      {activeTab === 'all' && (
        <>
          {/* Search */}
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
                      placeholder="Search by permission code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <p className="text-muted small mb-0">
                    Showing <strong>{filteredPermissions.length}</strong> of <strong>{allPermissions.length}</strong> permissions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Grid */}
          {Object.keys(groupedPermissions).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)).map(([group, perms]) => (
                <div key={group} className="card shadow-sm">
                  <div className="card-body">
                    <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="bi bi-folder2-open" style={{ color: '#0ea5e9' }}></i>
                      {group}
                      <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600 }}>{perms.length}</span>
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {perms.map(perm => (
                        <span key={perm} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: '#f8fafc', border: '1px solid #e2e8f0',
                          padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem',
                          fontWeight: 500, color: '#334155', transition: 'all 0.2s',
                        }}>
                          <i className="bi bi-shield-check" style={{ color: '#22c55e', fontSize: '0.75rem' }}></i>
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card shadow-sm text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }}></i>
              <h5 className="text-muted">No permissions found</h5>
              <p className="text-muted small">Try adjusting your search criteria</p>
            </div>
          )}
        </>
      )}

      {/* User Permissions Tab */}
      {activeTab === 'user' && (
        <>
          {/* User selector */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Select Employee / User</label>
                  <select className="form-select" value={selectedUserId} onChange={e => handleSelectUser(e.target.value)}>
                    <option value="">— Select an employee —</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {selectedUserId && (
            <>
              {loadingUserPerms || loadingSections ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary"></div>
                  <p className="mt-2 text-muted">Loading user permissions...</p>
                </div>
              ) : permSections ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Direct / Unique Permissions */}
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="bi bi-person-check" style={{ color: '#6366f1' }}></i>
                        Direct User Permissions
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                        {(permSections.uniquePermissions || []).length > 0 ? (
                          (permSections.uniquePermissions || []).map((perm: any) => {
                            const code = typeof perm === 'string' ? perm : (perm.permissionCode || perm.code);
                            return (
                              <span key={code} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: '#eef2ff', border: '1px solid #c7d2fe',
                                padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, color: '#4338ca',
                              }}>
                                {code}
                                <button onClick={() => handleRemoveUserPermission(code)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', padding: 0 }}>
                                  <i className="bi bi-x-circle-fill"></i>
                                </button>
                              </span>
                            );
                          })
                        ) : (
                          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No direct permissions assigned</p>
                        )}
                      </div>

                      {/* Assign new permission */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {allPermissions.length > 0 ? (
                          <select className="form-select form-select-sm" value={newPermissionCode}
                            onChange={e => setNewPermissionCode(e.target.value)} style={{ maxWidth: '350px' }}>
                            <option value="">Select permission to assign...</option>
                            {allPermissions.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        ) : (
                          <input type="text" className="form-control form-control-sm" placeholder="Permission code (e.g. Employees.Export)"
                            value={newPermissionCode} onChange={e => setNewPermissionCode(e.target.value)} style={{ maxWidth: '350px' }} />
                        )}
                        <button className="btn btn-sm btn-primary" disabled={!newPermissionCode || assigningUserPerm}
                          onClick={handleAssignUserPermission}>
                          {assigningUserPerm ? 'Assigning...' : <><i className="bi bi-plus-lg me-1"></i>Assign</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Position Permissions */}
                  {permSections.positionPermissions && (
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="bi bi-briefcase" style={{ color: '#f59e0b' }}></i>
                          Position Permissions
                          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>(inherited from position)</span>
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {(Array.isArray(permSections.positionPermissions) ? permSections.positionPermissions : []).map((perm: any, idx: number) => {
                            const code = typeof perm === 'string' ? perm : (perm.permissionCode || perm.code);
                            return (
                              <span key={idx} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: '#fef3c7', border: '1px solid #fcd34d',
                                padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, color: '#92400e',
                              }}>
                                <i className="bi bi-shield-fill" style={{ fontSize: '0.7rem' }}></i>
                                {code}
                              </span>
                            );
                          })}
                          {(Array.isArray(permSections.positionPermissions) ? permSections.positionPermissions : []).length === 0 && (
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No position permissions</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub-Position Permissions */}
                  {permSections.subPositionPermissions && (
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <h5 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <i className="bi bi-diagram-3" style={{ color: '#10b981' }}></i>
                          Sub-Position Permissions
                          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>(inherited from sub-position)</span>
                        </h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {(Array.isArray(permSections.subPositionPermissions) ? permSections.subPositionPermissions : []).map((perm: any, idx: number) => {
                            const code = typeof perm === 'string' ? perm : (perm.permissionCode || perm.code);
                            return (
                              <span key={idx} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: '#dcfce7', border: '1px solid #86efac',
                                padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, color: '#166534',
                              }}>
                                <i className="bi bi-shield-fill" style={{ fontSize: '0.7rem' }}></i>
                                {code}
                              </span>
                            );
                          })}
                          {(Array.isArray(permSections.subPositionPermissions) ? permSections.subPositionPermissions : []).length === 0 && (
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No sub-position permissions</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card shadow-sm text-center py-4">
                  <i className="bi bi-person-x" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                  <p className="text-muted mt-2">Could not load permissions for this user</p>
                </div>
              )}
            </>
          )}

          {!selectedUserId && (
            <div className="card shadow-sm text-center py-5">
              <i className="bi bi-person-badge" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}></i>
              <h5 className="text-muted">Select an employee to manage their permissions</h5>
              <p className="text-muted small">Choose an employee from the dropdown above to view and manage their permissions</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
