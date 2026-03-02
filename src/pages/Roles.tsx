import { useState, useEffect } from 'react';
import type { Role, Permission } from '../services/roleService';
import * as roleService from '../services/roleService';
import { permissionService } from '../services/permissionService';
import './Roles.css';

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);

  // Create form state
  const [createFormData, setCreateFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    permissionIds: [] as string[],
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Fetch all roles and permissions
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAllRoles();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await permissionService.getAllPermissions();
      setAllPermissions(data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditFormData({
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
    });
    setShowEditModal(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleManagePermissions = async (role: Role) => {
    setSelectedRole(role);
    // Fetch the role with its permissions
    try {
      const roleData = await roleService.getRoleById(role.id);
      const permIds = roleData.permissions?.map((p) => p.id) || [];
      setSelectedRolePermissions(permIds);
    } catch (err) {
      console.error('Failed to fetch role permissions:', err);
      setSelectedRolePermissions([]);
    }
    setShowPermissionsModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRole) return;
    try {
      await roleService.updateRole(selectedRole.id, editFormData);
      await fetchRoles();
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole) return;
    try {
      await roleService.deleteRole(selectedRole.id);
      await fetchRoles();
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await roleService.assignPermissionsToRole(selectedRole.id, {
        permissionIds: selectedRolePermissions,
        replaceExisting: true,
      });
      await fetchRoles();
      setShowPermissionsModal(false);
      setSelectedRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  };

  const handleCreateRole = async () => {
    try {
      await roleService.createRole(createFormData);
      await fetchRoles();
      setShowCreateForm(false);
      setCreateFormData({
        code: '',
        name: '',
        description: '',
        isActive: true,
        permissionIds: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleCreatePermissionToggle = (permissionId: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id: string) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedRolePermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Filter and search roles
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && role.isActive) ||
      (filter === 'inactive' && !role.isActive);

    return matchesSearch && matchesFilter;
  });

  if (loading)
    return <div className="roles-container"><p>Loading roles...</p></div>;

  return (
    <div className="roles-container">
      <div className="roles-header">
        <h1>Roles Management</h1>
        <button
          className="btn btn-create"
          onClick={() => setShowCreateForm(!showCreateForm)}
          title="Create a new role"
        >
          ➕ Add Role
        </button>
      </div>

      <div className="roles-controls">
        <input
          type="text"
          placeholder="Search by name or code..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
        >
          <option value="all">All Roles</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="roles-grid">
        {filteredRoles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.name}</h3>
              <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
                {role.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="role-body">
              <p className="role-code">Code: <strong>{role.code}</strong></p>
              {role.description && (
                <p className="role-description">{role.description}</p>
              )}
              <div className="role-stats">
                <span className="stat">
                  {role.permissionCount || role.permissions?.length || 0} Permissions
                </span>
              </div>
            </div>

            <div className="role-actions">
              <button
                className="btn btn-view"
                onClick={() => handleViewRole(role)}
                title="View details"
              >
                👁 Show
              </button>
              <button
                className="btn btn-edit"
                onClick={() => handleEditRole(role)}
                title="Edit role"
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-permissions"
                onClick={() => handleManagePermissions(role)}
                title="Manage permissions"
              >
                🔐 Permissions
              </button>
              <button
                className="btn btn-delete"
                onClick={() => handleDeleteRole(role)}
                title="Delete role"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="no-results">
          <p>No roles found matching your criteria.</p>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Role Details</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <p className="form-value">{selectedRole.name}</p>
              </div>
              <div className="form-group">
                <label>Code</label>
                <p className="form-value">{selectedRole.code}</p>
              </div>
              <div className="form-group">
                <label>Description</label>
                <p className="form-value">{selectedRole.description || 'No description'}</p>
              </div>
              <div className="form-group">
                <label>Status</label>
                <p className="form-value">
                  <span className={`badge ${selectedRole.isActive ? 'bg-success' : 'bg-danger'}`}>
                    {selectedRole.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="form-group">
                <label>Permissions ({selectedRole.permissions?.length || 0})</label>
                <div className="permissions-list">
                  {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                    selectedRole.permissions.map((perm) => (
                      <span key={perm.id} className="permission-tag">
                        {perm.name}
                      </span>
                    ))
                  ) : (
                    <p className="no-permissions">No permissions assigned</p>
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

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Role</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="isActive" className="checkbox-label">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, isActive: e.target.checked })
                    }
                  />
                  Active
                </label>
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
      {showDeleteModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Role</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the role <strong>{selectedRole.name}</strong>?
              </p>
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

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Manage Permissions - {selectedRole.name}</h2>
              <button className="modal-close" onClick={() => setShowPermissionsModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-3">Select permissions to assign to this role:</p>
              <div className="permissions-grid">
                {allPermissions.map((permission) => (
                  <label key={permission.id} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRolePermissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                    />
                    <span className="permission-name">{permission.name}</span>
                    <span className="permission-code">({permission.code})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPermissionsModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSavePermissions}>
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>🆕 Create New Role</h2>
              <button className="modal-close" onClick={() => setShowCreateForm(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="create-code">Code *</label>
                  <input
                    id="create-code"
                    type="text"
                    className="form-control"
                    value={createFormData.code}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, code: e.target.value })
                    }
                    placeholder="e.g., ADMIN, USER, MANAGER"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="create-name">Name *</label>
                  <input
                    id="create-name"
                    type="text"
                    className="form-control"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, name: e.target.value })
                    }
                    placeholder="e.g., Administrator, User, Manager"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="create-description">Description</label>
                <textarea
                  id="create-description"
                  className="form-control"
                  rows={2}
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, description: e.target.value })
                  }
                  placeholder="Describe the purpose of this role..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="create-isActive" className="checkbox-label">
                  <input
                    id="create-isActive"
                    type="checkbox"
                    checked={createFormData.isActive}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, isActive: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>

              <div className="form-group">
                <label>Permissions (Optional)</label>
                <p className="text-muted mb-2">Select permissions to assign to this role:</p>
                <div className="permissions-grid">
                  {allPermissions.map((permission) => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={createFormData.permissionIds.includes(permission.id)}
                        onChange={() => handleCreatePermissionToggle(permission.id)}
                      />
                      <span className="permission-name">{permission.name}</span>
                      <span className="permission-code">({permission.code})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateRole}>
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
