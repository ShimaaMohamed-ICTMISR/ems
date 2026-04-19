import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { Role, Permission } from "../services/roleService";
import * as roleService from "../services/roleService";
import { permissionService } from "../services/permissionService";
import { extractPermissionCodes, normalizePermission } from "../utils/permissionUtils";
import "./Roles.css";

const getNormalizedPermissionCodeSet = (permissionCodes: string[]): Set<string> =>
  new Set(permissionCodes.map((permissionCode) => normalizePermission(permissionCode)));

const toKnownPermissionCodes = (
  permissionValues: unknown,
  permissionCatalog: Permission[],
): string[] => {
  const catalogCodeByNormalized = new Map(
    permissionCatalog
      .filter((permission) => typeof permission.code === "string")
      .map((permission) => [normalizePermission(permission.code), permission.code]),
  );

  return Array.from(
    new Set(
      extractPermissionCodes(permissionValues)
        .map((permissionCode) => permissionCode.trim())
        .filter(Boolean)
        .map((permissionCode) => normalizePermission(permissionCode))
        .map(
          (normalizedCode) =>
            catalogCodeByNormalized.get(normalizedCode) || normalizedCode,
        ),
    ),
  );
};

const Roles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissionCountOverrides, setRolePermissionCountOverrides] =
    useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<
    string[]
  >([]);
  const [permissionsSearchInput, setPermissionsSearchInput] = useState("");
  const [isPermissionsModalLoading, setIsPermissionsModalLoading] =
    useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const latestRolesRequestRef = useRef(0);
  const permissionsSelectAllRef = useRef<HTMLInputElement | null>(null);

  // Create form state
  const [createFormData, setCreateFormData] = useState({
    code: "",
    name: "",
    description: "",
    isActive: true,
  });

  // Validation states
  const [codeValidation, setCodeValidation] = useState({
    isChecking: false,
    isValid: true,
    message: "",
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  // Fetch all roles and permissions
  useEffect(() => {
    fetchRoles();
  }, [pageNumber, pageSize, searchTerm, filter]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (pageNumber !== 1) {
      setPageNumber(1);
    }
  }, [searchTerm, filter, pageSize, pageNumber]);

  useEffect(() => {
    const debounceId = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);

    return () => clearTimeout(debounceId);
  }, [searchInput]);

  useEffect(() => {
    if (searchInput.trim() === searchTerm && !loading) {
      setIsSearching(false);
    }
  }, [searchInput, searchTerm, loading]);

  const fetchRoles = async () => {
    const requestId = ++latestRolesRequestRef.current;

    try {
      setLoading(true);
      const activeOnly =
        filter === "active" ? true : filter === "inactive" ? false : undefined;
      const response = await roleService.getRolesPaginated({
        searchTerm: searchTerm || undefined,
        activeOnly,
        pageNumber,
        pageSize,
      });

      if (requestId !== latestRolesRequestRef.current) return;

      setRoles(response.items || []);
      setTotalPages(response.totalPages);
      setHasMore(response.hasNextPage);
      setError(null);
    } catch (err) {
      if (requestId !== latestRolesRequestRef.current) return;

      console.error("Error fetching roles:", err);
      let errorMessage = "Failed to fetch roles";
      if (err instanceof Error) {
        if (err.message.includes("403")) {
          errorMessage = "You don't have permission to view roles. Contact your administrator.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      if (requestId === latestRolesRequestRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchPermissions = async (): Promise<Permission[]> => {
    try {
      const data = await permissionService.getAllPermissions();
      setAllPermissions(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      let errorMessage = "Failed to fetch permissions";
      if (err instanceof Error) {
        if (err.message.includes("403")) {
          errorMessage = "You don't have permission to view permissions. Contact your administrator.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      return [];
    }
  };

  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedRole(null);
    setSelectedRolePermissions([]);
    setPermissionsSearchInput("");
    setIsPermissionsModalLoading(false);
    setIsSavingPermissions(false);
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setShowViewModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditFormData({
      name: role.name,
      description: role.description || "",
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
    setPermissionsSearchInput("");
    setError(null);
    setShowPermissionsModal(true);
    setIsPermissionsModalLoading(true);

    try {
      const permissionCatalog =
        allPermissions.length > 0 ? allPermissions : await fetchPermissions();
      const rolePermissions = await roleService.getRolePermissions(role.id);
      const mappedPermissionCodes = toKnownPermissionCodes(
        rolePermissions,
        permissionCatalog,
      );
      setSelectedRolePermissions(mappedPermissionCodes);
      setRolePermissionCountOverrides((prev) => ({
        ...prev,
        [role.id]: mappedPermissionCodes.length,
      }));
    } catch (err) {
      console.error("Failed to fetch role permissions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load role permissions",
      );
      setSelectedRolePermissions([]);
    } finally {
      setIsPermissionsModalLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRole) return;
    try {
      await roleService.updateRole(selectedRole.id, editFormData);
      await fetchRoles();
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
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
      setError(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    setError(null);
    setIsSavingPermissions(true);

    try {
      const permissionCatalog =
        allPermissions.length > 0 ? allPermissions : await fetchPermissions();
      const activePermissionCodes = permissionCatalog
        .filter((permission) => permission.isActive !== false)
        .map((permission) => permission.code);
      const activePermissionCodeSet = getNormalizedPermissionCodeSet(
        activePermissionCodes,
      );
      const permissionCodes = toKnownPermissionCodes(
        selectedRolePermissions,
        permissionCatalog,
      ).filter((permissionCode) =>
        activePermissionCodeSet.has(normalizePermission(permissionCode)),
      );

      await roleService.assignPermissionsToRole(selectedRole.id, {
        permissionCodes,
        replaceExisting: true,
      });

      const refreshedPermissions = await roleService.getRolePermissions(selectedRole.id);
      const refreshedPermissionCodes = toKnownPermissionCodes(
        refreshedPermissions,
        permissionCatalog,
      );
      setSelectedRolePermissions(refreshedPermissionCodes);
      setRolePermissionCountOverrides((prev) => ({
        ...prev,
        [selectedRole.id]: refreshedPermissionCodes.length,
      }));

      try {
        await fetchRoles();
      } catch (refreshRolesError) {
        console.warn("Unable to refresh roles after permission save:", refreshRolesError);
      }

      setShowPermissionsModal(false);
      setSelectedRolePermissions([]);
      setSelectedRole(null);
      setError(null);
      toast.success("Permissions assigned successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign permissions to role",
      );
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleCreateRole = async () => {
    // Validate code uniqueness before creating
    if (!codeValidation.isValid) {
      setError("Please fix the validation errors before creating the role.");
      return;
    }

    if (!createFormData.code.trim() || !createFormData.name.trim()) {
      setError("Code and Name are required fields.");
      return;
    }

    try {
      await roleService.createRole(createFormData);
      await fetchRoles();
      setShowCreateForm(false);
      setCreateFormData({
        code: "",
        name: "",
        description: "",
        isActive: true,
      });
      setCodeValidation({
        isChecking: false,
        isValid: true,
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    }
  };

  const handlePermissionToggle = (permissionCode: string) => {
    const permission = allPermissions.find((item) => item.code === permissionCode);
    if (permission?.isActive === false) return;

    const normalizedTargetPermission = normalizePermission(permissionCode);

    setSelectedRolePermissions((prev) =>
      prev.some((code) => normalizePermission(code) === normalizedTargetPermission)
        ? prev.filter(
            (code) => normalizePermission(code) !== normalizedTargetPermission,
          )
        : [...prev, permissionCode],
    );
  };

  const filteredModalPermissions = allPermissions.filter((permission) => {
    const searchValue = permissionsSearchInput.trim().toLowerCase();
    if (!searchValue) return true;

    return (
      permission.name?.toLowerCase().includes(searchValue) ||
      permission.code?.toLowerCase().includes(searchValue) ||
      permission.description?.toLowerCase().includes(searchValue) ||
      permission.category?.toLowerCase().includes(searchValue)
    );
  });

  const allPermissionCodes = allPermissions
    .filter((permission) => permission.isActive !== false)
    .map((permission) => permission.code);
  const selectedRolePermissionCodeSet = new Set(
    selectedRolePermissions.map((permissionCode) =>
      normalizePermission(permissionCode),
    ),
  );
  const areAllPermissionsSelected =
    allPermissionCodes.length > 0 &&
    allPermissionCodes.every((permissionCode) =>
      selectedRolePermissionCodeSet.has(normalizePermission(permissionCode)),
    );
  const hasSomePermissionsSelected =
    !areAllPermissionsSelected && selectedRolePermissions.length > 0;

  const handleToggleSelectAllPermissions = (checked: boolean) => {
    if (checked) {
      setSelectedRolePermissions(allPermissionCodes);
      return;
    }

    setSelectedRolePermissions([]);
  };

  useEffect(() => {
    if (!permissionsSelectAllRef.current) return;
    permissionsSelectAllRef.current.indeterminate = hasSomePermissionsSelected;
  }, [hasSomePermissionsSelected]);

  // Validate role code uniqueness
  const validateRoleCode = async (code: string) => {
    if (!code.trim()) {
      setCodeValidation({
        isChecking: false,
        isValid: true,
        message: "",
      });
      return;
    }

    setCodeValidation({
      isChecking: true,
      isValid: true,
      message: "Checking code availability...",
    });

    try {
      // Get all roles to check for duplicates
      const allRoles = await roleService.getAllRoles();
      const isDuplicate = allRoles.some(
        (role) => role.code.toLowerCase() === code.toLowerCase(),
      );

      if (isDuplicate) {
        setCodeValidation({
          isChecking: false,
          isValid: false,
          message:
            "This code is already in use. Please choose a different code.",
        });
      } else {
        setCodeValidation({
          isChecking: false,
          isValid: true,
          message: "Code is available.",
        });
      }
    } catch (err) {
      setCodeValidation({
        isChecking: false,
        isValid: false,
        message: "Unable to validate code. Please try again.",
      });
    }
  };

  // Debounced code validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (createFormData.code && showCreateForm) {
        validateRoleCode(createFormData.code);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [createFormData.code, showCreateForm]);

  if (loading && roles.length === 0)
    return (
      <div className="roles-container">
        <p>Loading roles...</p>
      </div>
    );

  return (
    <div className="roles-container">
      <div className="roles-header">
        <h1>Roles Management</h1>
        <button
          className="btn btn-create"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) {
              // Reset form and validation when opening
              setCreateFormData({
                code: "",
                name: "",
                description: "",
                isActive: true,
              });
              setCodeValidation({
                isChecking: false,
                isValid: true,
                message: "",
              });
            }
          }}
          title="Create a new role"
        >
          ➕ Add Role
        </button>
      </div>

      <div className="roles-controls">
        <div className="roles-search-wrap">
          <input
            type="text"
            placeholder="Search by name or code..."
            className="search-input"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setIsSearching(true);
            }}
          />
          {isSearching && (
            <span
              className="roles-search-loader"
              aria-live="polite"
              aria-label="Searching roles"
            >
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            </span>
          )}
        </div>
        <select
          className="filter-select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "active" | "inactive")
          }
        >
          <option value="all">All Roles</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
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

      <div className="roles-grid">
        {roles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.name}</h3>
              <span
                className={`status-badge ${role.isActive ? "active" : "inactive"}`}
              >
                {role.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="role-body">
              <p className="role-code">
                Code: <strong>{role.code}</strong>
              </p>
              {role.description && (
                <p className="role-description">{role.description}</p>
              )}
              <div className="role-stats">
                <span className="stat">
                  {rolePermissionCountOverrides[role.id] ??
                    role.permissionCount ??
                    role.permissions?.length ??
                    0}{" "}
                  Permissions
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

      {roles.length === 0 && !loading && (
        <div className="no-results">
          <p>No roles found matching your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
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
          <span className="text-muted"> ({roles.length} roles)</span>
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
      {showViewModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Role Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
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
                <p className="form-value">
                  {selectedRole.description || "No description"}
                </p>
              </div>
              <div className="form-group">
                <label>Status</label>
                <p className="form-value">
                  <span
                    className={`badge ${selectedRole.isActive ? "bg-success" : "bg-danger"}`}
                  >
                    {selectedRole.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="form-group">
                <label>
                  Permissions ({selectedRole.permissions?.length || 0})
                </label>
                <div className="permissions-list">
                  {selectedRole.permissions &&
                  selectedRole.permissions.length > 0 ? (
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
              <button
                className="btn btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
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
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
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
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
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
                      setEditFormData({
                        ...editFormData,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
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
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="modal-content modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Role</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the role{" "}
                <strong>{selectedRole.name}</strong>?
              </p>
              <p className="text-muted">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
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
        <div
          className="modal-overlay"
          onClick={closePermissionsModal}
        >
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Manage Permissions - {selectedRole.name}</h2>
              <button
                className="modal-close"
                onClick={closePermissionsModal}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-3">Select permissions to assign to this role:</p>
              <div className="permissions-bulk-controls">
                <label
                  className="permissions-select-all-label"
                  htmlFor="permissions-select-all"
                >
                  <input
                    ref={permissionsSelectAllRef}
                    id="permissions-select-all"
                    type="checkbox"
                    checked={areAllPermissionsSelected}
                    onChange={(e) =>
                      handleToggleSelectAllPermissions(e.target.checked)
                    }
                  />
                  Select all permissions
                </label>
                <span className="permissions-selection-count">
                  {selectedRolePermissions.length} selected
                </span>
              </div>

              <div className="permissions-search-controls">
                <input
                  type="text"
                  className="form-control permissions-search-input"
                  placeholder="Search permissions by name, code, category, or description"
                  value={permissionsSearchInput}
                  onChange={(e) => setPermissionsSearchInput(e.target.value)}
                />
              </div>

              {isPermissionsModalLoading ? (
                <p className="permissions-search-empty">Loading role permissions...</p>
              ) : filteredModalPermissions.length > 0 ? (
                <div className="permissions-grid">
                  {filteredModalPermissions.map((permission) => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRolePermissionCodeSet.has(
                          normalizePermission(permission.code),
                        )}
                        onChange={() => handlePermissionToggle(permission.code)}
                      />
                      <span className="permission-name">{permission.name}</span>
                      <span className="permission-code">
                        ({permission.code})
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="permissions-search-empty">
                  No permissions match the current search.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closePermissionsModal}
                disabled={isSavingPermissions}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSavePermissions}
                disabled={isPermissionsModalLoading || isSavingPermissions}
              >
                {isSavingPermissions ? "Saving..." : "Save Permissions"}
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
              <button
                className="modal-close"
                onClick={() => setShowCreateForm(false)}
              >
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
                    className={`form-control ${
                      createFormData.code && !codeValidation.isValid
                        ? "is-invalid"
                        : createFormData.code &&
                            codeValidation.isValid &&
                            !codeValidation.isChecking
                          ? "is-valid"
                          : ""
                    }`}
                    value={createFormData.code}
                    onChange={(e) => {
                      const value = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, "");
                      setCreateFormData({ ...createFormData, code: value });
                    }}
                    placeholder="e.g., ADMIN, USER, MANAGER"
                    maxLength={50}
                  />
                  {codeValidation.isChecking && (
                    <div className="form-feedback text-info">
                      <i className="spinner-border spinner-border-sm me-1"></i>
                      {codeValidation.message}
                    </div>
                  )}
                  {!codeValidation.isChecking && codeValidation.message && (
                    <div
                      className={`form-feedback ${codeValidation.isValid ? "text-success" : "text-danger"}`}
                    >
                      {codeValidation.isValid ? "✓" : "✗"}{" "}
                      {codeValidation.message}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    Code must be unique and contain only uppercase letters,
                    numbers, and underscores.
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="create-name">Name *</label>
                  <input
                    id="create-name"
                    type="text"
                    className="form-control"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
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
                    setCreateFormData({
                      ...createFormData,
                      description: e.target.value,
                    })
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
                      setCreateFormData({
                        ...createFormData,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateFormData({
                    code: "",
                    name: "",
                    description: "",
                    isActive: true,
                  });
                  setCodeValidation({
                    isChecking: false,
                    isValid: true,
                    message: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateRole}
                disabled={
                  !createFormData.code.trim() ||
                  !createFormData.name.trim() ||
                  codeValidation.isChecking ||
                  !codeValidation.isValid
                }
              >
                {codeValidation.isChecking ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Validating...
                  </>
                ) : (
                  "Create Role"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
