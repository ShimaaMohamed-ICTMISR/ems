import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Department } from "../../services/hrProjectManagementService";
import hrService from "../../services/hrProjectManagementService";
import { useHrPermissions } from "../../hooks/useHrPermissions";
import { HR_PERMISSION_KEYS } from "../../config/hrPermissions";
import { AccessDeniedState } from "../../Components/AccessDeniedState";
import { hrToast } from "../../utils/hrToast";
import "../styles/Departments.css";

export function Departments() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const { canAny } = useHrPermissions();
  const canViewDepartment = canAny([...HR_PERMISSION_KEYS.DEPARTMENTS.VIEW]);
  const canCreateDepartment = canAny([
    ...HR_PERMISSION_KEYS.DEPARTMENTS.CREATE,
  ]);
  const canEditDepartment = canAny([...HR_PERMISSION_KEYS.DEPARTMENTS.EDIT]);
  const canDeleteDepartment = canAny([
    ...HR_PERMISSION_KEYS.DEPARTMENTS.DELETE,
  ]);

  useEffect(() => {
    if (!canViewDepartment) {
      setLoading(false);
      return;
    }

    fetchDepartments();
    fetchEmployees();
  }, [canViewDepartment]);

  const fetchEmployees = async () => {
    try {
      const response = await hrService.getEmployees();
      const empData =
        response.data?.data?.data || response.data?.data || response.data;
      const empList = Array.isArray(empData) ? empData : [];
      setEmployees(empList);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await hrService.getDepartments();
      const deptData = response.data.data || response.data;
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    if (!canCreateDepartment) {
      setError("You do not have permission to create departments.");
      return;
    }

    navigate("/dashboard/hr/departments/create");
  };

  const handleEditDepartment = (id: string) => {
    if (!canEditDepartment) {
      setError("You do not have permission to edit departments.");
      return;
    }

    navigate(`/dashboard/hr/departments/${id}/edit`);
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!canDeleteDepartment) {
      setError("You do not have permission to delete departments.");
      return;
    }

    try {
      await hrService.deleteDepartment(id);
      setDepartments(departments.filter((d) => d.id !== id));
      hrToast.success("Department deleted successfully!");
    } catch (err) {
      console.error("Error deleting department:", err);
      setError("Failed to delete department");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilter = () => {
    console.log("Filter clicked");
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getEmployeeName = (empId: string | undefined) => {
    if (!empId) return null;
    const emp = employees.find((e) => e.id === empId);
    return emp ? `${emp.firstName} ${emp.lastName}` : null;
  };

  const getDepartmentName = (deptId: string | undefined) => {
    if (!deptId) return null;
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : null;
  };

  if (loading && canViewDepartment) {
    return (
      <div className="departments-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="departments-container">
      <div className="departments-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">
              <i className="bi bi-building me-3"></i>
              Departments
            </h1>
            <p className="page-subtitle">
              Manage organization departments and structure
            </p>
          </div>
        </div>
        {canCreateDepartment && (
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateDepartment}
          >
            <i className="bi bi-plus-circle me-2"></i>
            New Department
          </button>
        )}
      </div>

      {canViewDepartment ? (
        <>
          <div className="departments-controls">
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={handleFilter}
            >
              <i className="bi bi-funnel me-2"></i>
              Filter
            </button>
          </div>

          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {/* {isDev && (
            <details className="mb-3">
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                Departments Permission Debug
              </summary>
              <pre
                className="mt-2 p-3 bg-light border rounded"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {JSON.stringify(departmentPermissionDebug, null, 2)}
              </pre>
            </details>
          )} */}

          <div className="departments-grid">
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map((dept) => (
                <div key={dept.id} className="department-card-wrapper">
                  <div className="department-card">
                    <div className="card-header">
                      <div className="header-top">
                        <h3 className="card-title">{dept.name}</h3>
                        <span className="code-badge">{dept.code}</span>
                      </div>
                    </div>

                    <div className="card-body">
                      {dept.description && (
                        <div className="dept-info">
                          <label>Description</label>
                          <p>{dept.description}</p>
                        </div>
                      )}

                      <div className="info-grid">
                        <div className="info-item">
                          <label>
                            <i className="bi bi-person"></i> Head
                          </label>
                          <p>
                            {(() => {
                              const typedDept = dept as Department & {
                                head?: {
                                  firstName?: string;
                                  lastName?: string;
                                };
                              };

                              return (
                                (typedDept.head
                                  ? `${typedDept.head.firstName || ""} ${typedDept.head.lastName || ""}`.trim()
                                  : getEmployeeName(dept.headId)) ||
                                (dept.headId
                                  ? `${dept.headId.substring(0, 8)}...`
                                  : "Unassigned")
                              );
                            })()}
                          </p>
                        </div>

                        <div className="info-item">
                          <label>
                            <i className="bi bi-diagram-3"></i> Parent
                          </label>
                          <p>
                            {(() => {
                              const typedDept = dept as Department & {
                                parent?: { name?: string };
                              };

                              return (
                                typedDept.parent?.name ||
                                getDepartmentName(dept.parentId) ||
                                (dept.parentId ? (
                                  `${dept.parentId.substring(0, 8)}...`
                                ) : (
                                  <span
                                    style={{
                                      color: "#95a5a6",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Root Department
                                  </span>
                                ))
                              );
                            })()}
                          </p>
                        </div>

                        <div className="info-item">
                          <label>
                            <i className="bi bi-wallet2"></i> Cost Center
                          </label>
                          <p className="cost-center-badge">{dept.costCenter}</p>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      {canEditDepartment && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditDepartment(dept.id)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </button>
                      )}
                      {canDeleteDepartment && (
                        <div className="dropdown">
                          <button
                            className="btn btn-sm btn-outline-danger dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            <i className="bi bi-trash me-1"></i>
                            Delete
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <a
                                className="dropdown-item text-danger"
                                href="#!"
                              >
                                <strong>Are you sure?</strong>
                              </a>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => handleDeleteDepartment(dept.id)}
                              >
                                <i className="bi bi-check-circle me-2"></i>
                                Yes, Delete
                              </button>
                            </li>
                            <li>
                              <button className="dropdown-item">
                                <i className="bi bi-x-circle me-2"></i>
                                Cancel
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-state">
                <i className="bi bi-inbox"></i>
                <h3>No departments found</h3>
                <p>
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "Create your first department to get started"}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <AccessDeniedState
            title="Departments are restricted"
            description="You do not have permission to view department details."
          />

          {/* {isDev && (
            <details className="mt-4">
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                Departments Permission Debug
              </summary>
              <pre
                className="mt-2 p-3 bg-light border rounded"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {JSON.stringify(departmentPermissionDebug, null, 2)}
              </pre>
            </details>
          )} */}
        </>
      )}
    </div>
  );
}

export default Departments;
