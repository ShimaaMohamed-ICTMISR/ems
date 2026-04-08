import { useState, useEffect } from 'react';
import type { User, CreateUserDto, UpdateUserDto, AssignRoleDto, UserSession } from '../services/userService';
import * as userService from '../services/userService';
import * as roleService from '../services/roleService';
import type { Role } from '../services/roleService';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(true); // Default to true
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);

  // Form states
  const [createFormData, setCreateFormData] = useState<CreateUserDto>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    passwordConfirmation: '',
    phoneNumber: '',
  });

  const [editFormData, setEditFormData] = useState<UpdateUserDto>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [assignRoleData, setAssignRoleData] = useState<AssignRoleDto>({
    roleId: '',
    expiresAt: '',
    notes: '',
  });

  useEffect(() => {
    // Reset to page 1 when filters change
    setPageNumber(1);
  }, [searchTerm, activeOnly, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [pageNumber, pageSize, searchTerm, activeOnly]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        searchTerm: searchTerm || undefined,
        activeOnly,
        pageNumber,
        pageSize,
      });
      
      // Extract users from paginated response
      setUsers(response.items || []);
      setTotalPages(response.totalPages);
      setHasMore(response.hasNextPage);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await roleService.getAllRoles();
      setRoles(data.filter(r => r.isActive));
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      console.log('Viewing user:', user.id);
      const fullUser = await userService.getUserById(user.id);
      setSelectedUser(fullUser);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error viewing user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleManageRoles = async (user: User) => {
    try {
      const fullUser = await userService.getUserById(user.id);
      setSelectedUser(fullUser);
      setAssignRoleData({ roleId: '', expiresAt: '', notes: '' });
      setShowRolesModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
    }
  };

  const handleViewSessions = async (user: User) => {
    try {
      const sessions = await userService.getUserSessions(user.id);
      setUserSessions(sessions);
      setSelectedUser(user);
      setShowSessionsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    }
  };

  const handleCreateUser = async () => {
    try {
      console.log('Creating user:', createFormData);
      await userService.createUser(createFormData);
      await fetchUsers();
      setShowCreateModal(false);
      setCreateFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        passwordConfirmation: '',
        phoneNumber: '',
      });
      alert('User created successfully!');
    } catch (err) {
      console.error('Create error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      console.log('Updating user:', selectedUser.id, editFormData);
      await userService.updateUser(selectedUser.id, editFormData);
      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      console.log('Deleting user:', selectedUser.id);
      await userService.deleteUser(selectedUser.id);
      
      // Close modal first
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      // Check if we need to go back a page (if this was the last user on the page)
      if (users.length === 1 && pageNumber > 1) {
        setPageNumber(pageNumber - 1);
      } else {
        // Refresh the current page
        await fetchUsers();
      }
      
      // Show success message
      alert('User deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      await userService.reactivateUser(userId);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate user');
    }
  };

  const handleToggleMfa = async (userId: string, currentMfaState: boolean) => {
    try {
      console.log('Toggling MFA for user:', userId, 'Current state:', currentMfaState);
      
      // Call the API first
      await userService.toggleUserMfa(userId);
      
      // Update the local state to reflect the new state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, mfaEnabled: !currentMfaState } : u
        )
      );
      
      console.log('MFA toggled successfully to:', !currentMfaState);
    } catch (err) {
      console.error('Error toggling MFA:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle MFA');
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to toggle MFA'}`);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !assignRoleData.roleId) return;
    try {
      await userService.assignRoleToUser(selectedUser.id, assignRoleData);
      const updatedUser = await userService.getUserById(selectedUser.id);
      setSelectedUser(updatedUser);
      setAssignRoleData({ roleId: '', expiresAt: '', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedUser) return;
    try {
      await userService.removeRoleFromUser(selectedUser.id, roleId);
      const updatedUser = await userService.getUserById(selectedUser.id);
      setSelectedUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await userService.revokeSession(sessionId);
      if (selectedUser) {
        const sessions = await userService.getUserSessions(selectedUser.id);
        setUserSessions(sessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  if (loading && users.length === 0) {
    return <div className="users-container"><p>Loading users...</p></div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>
          <i className="bi bi-people-fill me-2"></i>
          User Management
        </h1>
        <button
          className="btn btn-create"
          onClick={() => setShowCreateModal(true)}
          title="Create a new user"
        >
          <i className="bi bi-person-plus-fill me-2"></i>
          Add User
        </button>
      </div>

      <div className="users-controls">
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active Only
        </label>
        <select
          className="page-size-select"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {import.meta.env.DEV && (
        <details style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info (Dev Only)</summary>
          <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>
            {JSON.stringify({ 
              usersCount: users.length, 
              isArray: Array.isArray(users),
              pageNumber,
              pageSize,
              hasMore,
              loading
            }, null, 2)}
          </pre>
        </details>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>MFA</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber || '-'}</td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <label className="mfa-toggle-switch" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={user.mfaEnabled || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        console.log('Toggle clicked for user:', user.username, 'Current MFA:', user.mfaEnabled);
                        handleToggleMfa(user.id, user.mfaEnabled || false);
                      }}
                      title={user.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    />
                    <span className="mfa-toggle-slider"></span>
                  </label>
                </td>
                <td>{user.roles?.length || 0}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-view"
                      onClick={() => handleViewUser(user)}
                      title="View details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEditUser(user)}
                      title="Edit user"
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-roles"
                      onClick={() => handleManageRoles(user)}
                      title="Manage roles"
                    >
                      <i className="bi bi-shield-lock"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-sessions"
                      onClick={() => handleViewSessions(user)}
                      title="View sessions"
                    >
                      <i className="bi bi-display"></i>
                    </button>
                    {!user.isActive && (
                      <button
                        className="btn btn-sm btn-reactivate"
                        onClick={() => handleReactivateUser(user.id)}
                        title="Reactivate user"
                      >
                        <i className="bi bi-arrow-clockwise"></i>
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDeleteUser(user)}
                      title="Delete user"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="no-results">
          <p>No users found matching your criteria.</p>
        </div>
      )}

      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setPageNumber(1)}
          disabled={pageNumber === 1 || loading}
        >
          First
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber === 1 || loading}
        >
          Previous
        </button>
        <span className="page-info">
          Page {pageNumber} of {totalPages}
          <span className="text-muted"> ({users.length} users)</span>
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => setPageNumber(pageNumber + 1)}
          disabled={!hasMore || loading}
        >
          Next
        </button>
      </div>

      {/* View Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Username</label>
                <p className="form-value">{selectedUser.username}</p>
              </div>
              <div className="form-group">
                <label>Email</label>
                <p className="form-value">{selectedUser.email}</p>
              </div>
              <div className="form-group">
                <label>Name</label>
                <p className="form-value">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <p className="form-value">{selectedUser.phoneNumber || 'Not provided'}</p>
              </div>
              <div className="form-group">
                <label>Status</label>
                <p className="form-value">
                  <span className={`badge ${selectedUser.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="form-group">
                <label>MFA Enabled</label>
                <p className="form-value">{selectedUser.mfaEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div className="form-group">
                <label>Roles ({selectedUser.roles?.length || 0})</label>
                <div className="roles-list">
                  {selectedUser.roles && selectedUser.roles.length > 0 ? (
                    selectedUser.roles.map((role) => (
                      <div key={`${role.roleId}-view`} className="role-item">
                        <span className="role-tag">{role.roleName || role.roleCode}</span>
                        {role.expiresAt && (
                          <span className="role-expiry">Expires: {new Date(role.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="no-roles">No roles assigned</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <input
                    id="username"
                    type="text"
                    className="form-control"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    id="firstName"
                    type="text"
                    className="form-control"
                    value={createFormData.firstName}
                    onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    id="lastName"
                    type="text"
                    className="form-control"
                    value={createFormData.lastName}
                    onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  className="form-control"
                  value={createFormData.phoneNumber}
                  onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="passwordConfirmation">Confirm Password *</label>
                  <input
                    id="passwordConfirmation"
                    type="password"
                    className="form-control"
                    value={createFormData.passwordConfirmation}
                    onChange={(e) => setCreateFormData({ ...createFormData, passwordConfirmation: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateUser}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-firstName">First Name</label>
                <input
                  id="edit-firstName"
                  type="text"
                  className="form-control"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-lastName">Last Name</label>
                <input
                  id="edit-lastName"
                  type="text"
                  className="form-control"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-phoneNumber">Phone Number</label>
                <input
                  id="edit-phoneNumber"
                  type="tel"
                  className="form-control"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedUser.username}</strong>?</p>
              <p className="text-muted">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles Management Modal */}
      {showRolesModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRolesModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Roles - {selectedUser.username}</h2>
              <button className="modal-close" onClick={() => setShowRolesModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="assigned-roles">
                <h3>Assigned Roles</h3>
                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                  <div className="roles-list">
                    {selectedUser.roles.map((role) => (
                      <div key={`${role.roleId}-manage`} className="role-item">
                        <div>
                          <strong>{role.roleName || role.roleCode}</strong>
                          {role.expiresAt && (
                            <span className="role-expiry">
                              Expires: {new Date(role.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                          {role.notes && <p className="role-notes">{role.notes}</p>}
                        </div>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveRole(role.roleId)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-roles">No roles assigned</p>
                )}
              </div>

              <hr />

              <div className="assign-role-form">
                <h3>Assign New Role</h3>
                <div className="form-group">
                  <label htmlFor="roleId">Role</label>
                  <select
                    id="roleId"
                    className="form-control"
                    value={assignRoleData.roleId}
                    onChange={(e) => setAssignRoleData({ ...assignRoleData, roleId: e.target.value })}
                  >
                    <option value="">Select a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="expiresAt">Expires At (Optional)</label>
                  <input
                    id="expiresAt"
                    type="datetime-local"
                    className="form-control"
                    value={assignRoleData.expiresAt}
                    onChange={(e) => setAssignRoleData({ ...assignRoleData, expiresAt: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    className="form-control"
                    rows={2}
                    value={assignRoleData.notes}
                    onChange={(e) => setAssignRoleData({ ...assignRoleData, notes: e.target.value })}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignRole}
                  disabled={!assignRoleData.roleId}
                >
                  Assign Role
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRolesModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessionsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowSessionsModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Active Sessions - {selectedUser.username}</h2>
              <button className="modal-close" onClick={() => setShowSessionsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {userSessions.length > 0 ? (
                <div className="sessions-list">
                  {userSessions.map((session) => (
                    <div key={session.sessionId} className="session-item">
                      <div className="session-info">
                        <p><strong>IP:</strong> {session.ipAddress || 'Unknown'}</p>
                        <p><strong>User Agent:</strong> {session.userAgent || 'Unknown'}</p>
                        <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</p>
                        {session.expiresAt && (
                          <p><strong>Expires:</strong> {new Date(session.expiresAt).toLocaleString()}</p>
                        )}
                        <span className={`status-badge ${session.isActive ? 'active' : 'inactive'}`}>
                          {session.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {session.isActive && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRevokeSession(session.sessionId)}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-sessions">No active sessions</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSessionsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
