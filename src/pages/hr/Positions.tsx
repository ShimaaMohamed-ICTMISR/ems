import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Position,
  SubPosition,
} from "../../services/hrProjectManagementService";
import hrService from "../../services/hrProjectManagementService";
import { useHrPermissions } from "../../hooks/useHrPermissions";
import { HR_PERMISSION_KEYS } from "../../config/hrPermissions";
import { AccessDeniedState } from "../../Components/AccessDeniedState";
import { hrToast } from "../../utils/hrToast";
import "../styles/Departments.css";

export function Positions() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Sub-position state
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [subPositions, setSubPositions] = useState<
    Record<string, SubPosition[]>
  >({});
  const [loadingSubPositions, setLoadingSubPositions] = useState<string | null>(
    null,
  );

  // Sub-position form
  const [showSubForm, setShowSubForm] = useState<string | null>(null);
  const [subTitle, setSubTitle] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subInherits, setSubInherits] = useState(true);
  const [subSubmitting, setSubSubmitting] = useState(false);

  // Permission state
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [positionPermissions, setPositionPermissions] = useState<any[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedPermissionPackage, setSelectedPermissionPackage] =
    useState("");
  const [assigningPermission, setAssigningPermission] = useState(false);

  // Available permissions from HR service
  const [availablePermissions, setAvailablePermissions] = useState<string[]>(
    [],
  );
  const { canAny } = useHrPermissions();
  const canViewPositions = canAny([...HR_PERMISSION_KEYS.POSITIONS.VIEW]);
  const canCreatePositions = canAny([...HR_PERMISSION_KEYS.POSITIONS.CREATE]);
  const canEditPositions = canAny([...HR_PERMISSION_KEYS.POSITIONS.EDIT]);
  const canDeletePositions = canAny([...HR_PERMISSION_KEYS.POSITIONS.DELETE]);

  const toComparablePermissionName = (permissionCode: string): string =>
    permissionCode
      .trim()
      .replace(/^HR\./i, "")
      .replace(/^HumanResources\./i, "");

  const getPermissionCode = (permission: unknown): string => {
    if (typeof permission === "string") return permission;

    if (permission && typeof permission === "object") {
      const typedPermission = permission as {
        permissionCode?: string;
        code?: string;
        name?: string;
      };
      return (
        typedPermission.name ||
        typedPermission.permissionCode ||
        typedPermission.code ||
        ""
      );
    }

    return "";
  };

  const formatPackageLabel = (packageKey: string): string =>
    packageKey
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .trim();

  const permissionPackages = useMemo(() => {
    const grouped = new Map<string, string[]>();

    availablePermissions.forEach((permissionCode) => {
      const normalizedPermission = toComparablePermissionName(permissionCode);
      const resourceKey = normalizedPermission.split(".")[0]?.trim() || "Other";
      const existing = grouped.get(resourceKey) || [];
      if (!existing.includes(normalizedPermission)) {
        existing.push(normalizedPermission);
      }
      grouped.set(resourceKey, existing);
    });

    return Array.from(grouped.entries())
      .map(([key, permissions]) => ({
        key,
        label: formatPackageLabel(key),
        permissions: [...permissions].sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availablePermissions]);

  useEffect(() => {
    if (!canViewPositions) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await hrService.getPositions();
        const list = res.data?.data || res.data || [];
        if (mounted) {
          setPositions(Array.isArray(list) ? list : []);
          setError(null);
        }
      } catch (err: any) {
        console.error("Error fetching positions:", err);
        if (mounted)
          setError(err.response?.data?.message || "Failed to load positions");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [canViewPositions]);

  // Load available permissions
  useEffect(() => {
    hrService
      .getHrPermissions()
      .then((res) => {
        const data = res.data?.data || res.data;
        const perms = data?.permissions || data || [];
        const normalizedPermissions = Array.isArray(perms)
          ? perms
              .map((permission) => getPermissionCode(permission))
              .map((permission) => toComparablePermissionName(permission))
              .filter(Boolean)
          : [];

        setAvailablePermissions(Array.from(new Set(normalizedPermissions)));
      })
      .catch((err) => console.error("Error loading HR permissions:", err));
  }, []);

  const handleCreatePosition = () => {
    if (!canCreatePositions) {
      setError("You do not have permission to create positions.");
      return;
    }

    navigate("/dashboard/hr/positions/create");
  };

  const handleEditPosition = (id: string) => {
    if (!canEditPositions) {
      setError("You do not have permission to edit positions.");
      return;
    }

    navigate(`/dashboard/hr/positions/${id}/edit`);
  };

  const handleDeletePosition = async (id: string) => {
    if (!canDeletePositions) {
      setError("You do not have permission to delete positions.");
      return;
    }

    try {
      await hrService.deletePosition(id);
      setPositions((p) => p.filter((x) => x.id !== id));
      hrToast.success("Position deleted");
    } catch (err) {
      console.error("Error deleting position:", err);
      setError("Failed to delete position");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  // Sub-positions
  const toggleSubPositions = async (positionId: string) => {
    if (expandedPosition === positionId) {
      setExpandedPosition(null);
      return;
    }
    setExpandedPosition(positionId);
    if (!subPositions[positionId]) {
      setLoadingSubPositions(positionId);
      try {
        const res = await hrService.getSubPositions(positionId);
        const list = res.data?.data || res.data || [];
        setSubPositions((prev) => ({
          ...prev,
          [positionId]: Array.isArray(list) ? list : [],
        }));
      } catch (err) {
        console.error("Error loading sub-positions:", err);
      } finally {
        setLoadingSubPositions(null);
      }
    }
  };

  const handleCreateSubPosition = async (positionId: string) => {
    if (!canCreatePositions) {
      setError("You do not have permission to create sub-positions.");
      return;
    }

    if (!subTitle || !subCode) return;
    setSubSubmitting(true);
    try {
      await hrService.createSubPosition(positionId, {
        title: subTitle,
        code: subCode,
        description: subDescription || undefined,
        inheritsParentPermissions: subInherits,
      });
      // Refresh sub-positions
      const res = await hrService.getSubPositions(positionId);
      const list = res.data?.data || res.data || [];
      setSubPositions((prev) => ({
        ...prev,
        [positionId]: Array.isArray(list) ? list : [],
      }));
      setShowSubForm(null);
      setSubTitle("");
      setSubCode("");
      setSubDescription("");
      setSubInherits(true);
    } catch (err: any) {
      console.error("Error creating sub-position:", err);
      hrToast.error(
        err.response?.data?.message || "Failed to create sub-position",
      );
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleDeleteSubPosition = async (
    positionId: string,
    subPositionId: string,
  ) => {
    if (!canDeletePositions) {
      setError("You do not have permission to delete sub-positions.");
      return;
    }

    try {
      await hrService.deleteSubPosition(positionId, subPositionId);
      setSubPositions((prev) => ({
        ...prev,
        [positionId]: (prev[positionId] || []).filter(
          (s) => s.id !== subPositionId,
        ),
      }));
    } catch (err) {
      console.error("Error deleting sub-position:", err);
      hrToast.error("Failed to delete sub-position");
    }
  };

  // Permissions
  const togglePermissions = async (positionId: string) => {
    if (showPermissions === positionId) {
      setShowPermissions(null);
      return;
    }
    setShowPermissions(positionId);
    setSelectedPermissionPackage("");
    setLoadingPermissions(true);
    try {
      const res = await hrService.getPositionPermissions(positionId);
      const data = res.data?.data || res.data || [];
      setPositionPermissions(
        Array.isArray(data) ? data : data?.permissions || [],
      );
    } catch (err) {
      console.error("Error loading permissions:", err);
      setPositionPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleAssignPermissionPackage = async (positionId: string) => {
    if (!canEditPositions) {
      setError("You do not have permission to manage position permissions.");
      return;
    }

    if (!selectedPermissionPackage) return;

    const selectedPackage = permissionPackages.find(
      (pkg) => pkg.key === selectedPermissionPackage,
    );
    if (!selectedPackage) return;

    const assignedPermissions = new Set(
      positionPermissions
        .map((permission) => getPermissionCode(permission))
        .map((permission) => toComparablePermissionName(permission))
        .filter(Boolean),
    );

    const missingPermissions = selectedPackage.permissions.filter(
      (permissionCode) =>
        !assignedPermissions.has(toComparablePermissionName(permissionCode)),
    );

    if (missingPermissions.length === 0) {
      setSelectedPermissionPackage("");
      return;
    }

    setAssigningPermission(true);
    const failedPermissions: string[] = [];

    try {
      for (const permissionCode of missingPermissions) {
        try {
          await hrService.assignPositionPermission(positionId, {
            permissionCode,
          });
        } catch (err) {
          console.error(`Failed to assign permission ${permissionCode}:`, err);
          failedPermissions.push(permissionCode);
        }
      }

      const res = await hrService.getPositionPermissions(positionId);
      const data = res.data?.data || res.data || [];
      setPositionPermissions(
        Array.isArray(data) ? data : data?.permissions || [],
      );

      if (failedPermissions.length > 0) {
        hrToast.warning(
          `Assigned package partially. Failed permissions: ${failedPermissions.join(", ")}`,
        );
      }

      setSelectedPermissionPackage("");
    } catch (err: any) {
      console.error("Error assigning permission package:", err);
      hrToast.error(
        err.response?.data?.message || "Failed to assign permission package",
      );
    } finally {
      setAssigningPermission(false);
    }
  };

  const handleRemovePermission = async (
    positionId: string,
    permissionCode: string,
  ) => {
    if (!canEditPositions) {
      setError("You do not have permission to manage position permissions.");
      return;
    }

    try {
      await hrService.removePositionPermission(positionId, permissionCode);
      const res = await hrService.getPositionPermissions(positionId);
      const data = res.data?.data || res.data || [];
      setPositionPermissions(
        Array.isArray(data) ? data : data?.permissions || [],
      );
    } catch (err) {
      console.error("Error removing permission:", err);
      hrToast.error("Failed to remove permission");
    }
  };

  const filtered = positions.filter(
    (pos) =>
      (pos.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pos.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pos.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="departments-container">
      <div className="departments-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">
              <i className="bi bi-briefcase me-3"></i>
              Positions
            </h1>
            <p className="page-subtitle">
              Manage job positions, sub-positions, and permissions
            </p>
          </div>
        </div>
        {canCreatePositions && (
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreatePosition}
          >
            <i className="bi bi-plus-circle me-2"></i>
            New Position
          </button>
        )}
      </div>

      {canViewPositions ? (
        <>
          <div className="departments-controls">
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title or code..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {loading && (
            <div className="departments-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading positions...</p>
            </div>
          )}

          {!loading && (
            <>
              {error && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              <div className="departments-grid">
                {filtered && filtered.length > 0 ? (
                  filtered.map((pos) => (
                    <div key={pos.id} className="department-card-wrapper">
                      <div className="department-card">
                        <div className="card-header">
                          <div className="header-top">
                            <h3 className="card-title">
                              {pos.title || "Untitled"}
                            </h3>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                alignItems: "center",
                              }}
                            >
                              <span className="code-badge">
                                {pos.code || pos.id}
                              </span>
                              {pos.isActive === false && (
                                <span
                                  style={{
                                    background: "rgba(239,68,68,0.3)",
                                    color: "white",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "4px",
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  INACTIVE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="card-body">
                          {pos.description && (
                            <div className="dept-info">
                              <label>Description</label>
                              <p>{pos.description}</p>
                            </div>
                          )}

                          <div className="info-grid">
                            <div className="info-item">
                              <label>
                                <i className="bi bi-building"></i> Department
                              </label>
                              <p>
                                {pos.department?.name ||
                                  pos.departmentId ||
                                  "N/A"}
                              </p>
                            </div>
                            <div className="info-item">
                              <label>
                                <i className="bi bi-cash-stack"></i> Salary Band
                              </label>
                              <p className="cost-center-badge">
                                {pos.salaryBandMin || "-"} -{" "}
                                {pos.salaryBandMax || "-"}
                              </p>
                            </div>
                          </div>

                          {/* Sub-Positions Section */}
                          <div style={{ marginTop: "1rem" }}>
                            <button
                              className="btn btn-sm btn-outline-secondary w-100"
                              onClick={() => toggleSubPositions(pos.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <i
                                className={`bi ${expandedPosition === pos.id ? "bi-chevron-up" : "bi-chevron-down"}`}
                              ></i>
                              Sub-Positions
                              {subPositions[pos.id] &&
                                ` (${subPositions[pos.id].length})`}
                            </button>

                            {expandedPosition === pos.id && (
                              <div
                                style={{
                                  marginTop: "0.75rem",
                                  padding: "0.75rem",
                                  background: "#f8f9fa",
                                  borderRadius: "8px",
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                {loadingSubPositions === pos.id ? (
                                  <div className="text-center py-2">
                                    <div className="spinner-border spinner-border-sm"></div>
                                  </div>
                                ) : (
                                  <>
                                    {(subPositions[pos.id] || []).length > 0 ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.5rem",
                                        }}
                                      >
                                        {(subPositions[pos.id] || []).map(
                                          (sub) => (
                                            <div
                                              key={sub.id}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "0.5rem 0.75rem",
                                                background: "white",
                                                borderRadius: "6px",
                                                border: "1px solid #ecf0f1",
                                              }}
                                            >
                                              <div>
                                                <strong
                                                  style={{
                                                    fontSize: "0.85rem",
                                                  }}
                                                >
                                                  {sub.title}
                                                </strong>
                                                <span
                                                  style={{
                                                    marginLeft: "0.5rem",
                                                    fontSize: "0.75rem",
                                                    color: "#7f8c8d",
                                                  }}
                                                >
                                                  {sub.code}
                                                </span>
                                                {sub.inheritsParentPermissions && (
                                                  <span
                                                    style={{
                                                      marginLeft: "0.5rem",
                                                      fontSize: "0.65rem",
                                                      background: "#dcfce7",
                                                      color: "#166534",
                                                      padding: "2px 6px",
                                                      borderRadius: "4px",
                                                    }}
                                                  >
                                                    Inherits
                                                  </span>
                                                )}
                                              </div>
                                              {canDeletePositions && (
                                                <button
                                                  className="btn btn-sm btn-outline-danger"
                                                  style={{
                                                    padding: "2px 8px",
                                                    fontSize: "0.75rem",
                                                  }}
                                                  onClick={() =>
                                                    handleDeleteSubPosition(
                                                      pos.id,
                                                      sub.id,
                                                    )
                                                  }
                                                >
                                                  <i className="bi bi-trash"></i>
                                                </button>
                                              )}
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <p
                                        style={{
                                          color: "#95a5a6",
                                          fontSize: "0.85rem",
                                          textAlign: "center",
                                          margin: "0.5rem 0",
                                        }}
                                      >
                                        No sub-positions
                                      </p>
                                    )}

                                    {showSubForm === pos.id &&
                                    canCreatePositions ? (
                                      <div
                                        style={{
                                          marginTop: "0.75rem",
                                          padding: "0.75rem",
                                          background: "white",
                                          borderRadius: "6px",
                                          border: "1px solid #06b6d4",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: "0.5rem",
                                            marginBottom: "0.5rem",
                                          }}
                                        >
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Title *"
                                            value={subTitle}
                                            onChange={(e) =>
                                              setSubTitle(e.target.value)
                                            }
                                          />
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Code *"
                                            value={subCode}
                                            onChange={(e) =>
                                              setSubCode(e.target.value)
                                            }
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm mb-2"
                                          placeholder="Description"
                                          value={subDescription}
                                          onChange={(e) =>
                                            setSubDescription(e.target.value)
                                          }
                                        />
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            marginBottom: "0.5rem",
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={subInherits}
                                            onChange={(e) =>
                                              setSubInherits(e.target.checked)
                                            }
                                            id={`inherit-${pos.id}`}
                                          />
                                          <label
                                            htmlFor={`inherit-${pos.id}`}
                                            style={{
                                              fontSize: "0.8rem",
                                              color: "#495057",
                                            }}
                                          >
                                            Inherit parent permissions
                                          </label>
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: "0.5rem",
                                          }}
                                        >
                                          <button
                                            className="btn btn-sm btn-primary"
                                            disabled={
                                              subSubmitting ||
                                              !subTitle ||
                                              !subCode
                                            }
                                            onClick={() =>
                                              handleCreateSubPosition(pos.id)
                                            }
                                          >
                                            {subSubmitting
                                              ? "Creating..."
                                              : "Create"}
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setShowSubForm(null)}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : canCreatePositions ? (
                                      <button
                                        className="btn btn-sm btn-outline-primary mt-2 w-100"
                                        onClick={() => setShowSubForm(pos.id)}
                                      >
                                        <i className="bi bi-plus me-1"></i> Add
                                        Sub-Position
                                      </button>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Permissions Section */}
                          <div style={{ marginTop: "0.75rem" }}>
                            <button
                              className="btn btn-sm btn-outline-secondary w-100"
                              onClick={() => togglePermissions(pos.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <i
                                className={`bi ${showPermissions === pos.id ? "bi-shield-fill-check" : "bi-shield-check"}`}
                              ></i>
                              Permissions
                            </button>

                            {showPermissions === pos.id && (
                              <div
                                style={{
                                  marginTop: "0.75rem",
                                  padding: "0.75rem",
                                  background: "#f0f9ff",
                                  borderRadius: "8px",
                                  border: "1px solid #bae6fd",
                                }}
                              >
                                {loadingPermissions ? (
                                  <div className="text-center py-2">
                                    <div className="spinner-border spinner-border-sm"></div>
                                  </div>
                                ) : (
                                  <>
                                    {positionPermissions.length > 0 ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: "0.4rem",
                                          marginBottom: "0.5rem",
                                        }}
                                      >
                                        {positionPermissions.map(
                                          (perm: any, idx: number) => {
                                            const code =
                                              getPermissionCode(perm);
                                            const source =
                                              typeof perm === "object"
                                                ? perm.source
                                                : undefined;
                                            return (
                                              <span
                                                key={idx}
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  gap: "4px",
                                                  background:
                                                    source === "inherited"
                                                      ? "#fef3c7"
                                                      : "#dbeafe",
                                                  color:
                                                    source === "inherited"
                                                      ? "#92400e"
                                                      : "#1e40af",
                                                  padding: "3px 8px",
                                                  borderRadius: "6px",
                                                  fontSize: "0.75rem",
                                                  fontWeight: 500,
                                                }}
                                              >
                                                {code}
                                                {source !== "inherited" &&
                                                  canEditPositions && (
                                                    <button
                                                      onClick={() =>
                                                        handleRemovePermission(
                                                          pos.id,
                                                          code,
                                                        )
                                                      }
                                                      style={{
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        color: "#ef4444",
                                                        fontSize: "0.7rem",
                                                        padding: 0,
                                                        marginLeft: "2px",
                                                      }}
                                                    >
                                                      <i className="bi bi-x-circle-fill"></i>
                                                    </button>
                                                  )}
                                              </span>
                                            );
                                          },
                                        )}
                                      </div>
                                    ) : (
                                      <p
                                        style={{
                                          color: "#64748b",
                                          fontSize: "0.82rem",
                                          textAlign: "center",
                                          margin: "0.5rem 0",
                                        }}
                                      >
                                        No permissions assigned
                                      </p>
                                    )}

                                    {canEditPositions && (
                                      <div
                                        style={{
                                          marginTop: "0.5rem",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.5rem",
                                        }}
                                      >
                                        <small
                                          style={{
                                            color: "#0c4a6e",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Assign permission package
                                        </small>

                                        {permissionPackages.length > 0 ? (
                                          <div
                                            style={{
                                              display: "flex",
                                              gap: "0.5rem",
                                            }}
                                          >
                                            <select
                                              className="form-select form-select-sm"
                                              value={selectedPermissionPackage}
                                              onChange={(e) =>
                                                setSelectedPermissionPackage(
                                                  e.target.value,
                                                )
                                              }
                                              style={{
                                                flex: 1,
                                                fontSize: "0.8rem",
                                              }}
                                            >
                                              <option value="">
                                                Select package...
                                              </option>
                                              {permissionPackages.map((pkg) => (
                                                <option
                                                  key={pkg.key}
                                                  value={pkg.key}
                                                >
                                                  {pkg.label} (
                                                  {pkg.permissions.length})
                                                </option>
                                              ))}
                                            </select>

                                            <button
                                              className="btn btn-sm btn-primary"
                                              disabled={
                                                !selectedPermissionPackage ||
                                                assigningPermission
                                              }
                                              onClick={() =>
                                                handleAssignPermissionPackage(
                                                  pos.id,
                                                )
                                              }
                                            >
                                              {assigningPermission ? (
                                                "..."
                                              ) : (
                                                <>
                                                  <i className="bi bi-box-seam me-1"></i>
                                                  Assign Package
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        ) : (
                                          <p
                                            style={{
                                              color: "#64748b",
                                              fontSize: "0.8rem",
                                              margin: 0,
                                            }}
                                          >
                                            No permission packages available.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="card-footer">
                          {canEditPositions && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditPosition(pos.id)}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Edit
                            </button>
                          )}
                          {canDeletePositions && (
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
                                    onClick={() => handleDeletePosition(pos.id)}
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
                    <h3>No positions found</h3>
                    <p>
                      {searchTerm
                        ? "Try adjusting your search criteria"
                        : "Create your first position to get started"}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <AccessDeniedState
          title="Positions are restricted"
          description="You do not have permission to view positions."
        />
      )}
    </div>
  );
}

export default Positions;
