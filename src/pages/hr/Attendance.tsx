import { useState, useEffect } from "react";
import type { Employee } from "../../services/hrProjectManagementService";
import hrService from "../../services/hrProjectManagementService";
import { useHrPermissions } from "../../hooks/useHrPermissions";
import { HR_PERMISSION_KEYS } from "../../config/hrPermissions";
import { AccessDeniedState } from "../../Components/AccessDeniedState";
import { hrToast } from "../../utils/hrToast";
import "../styles/Attendance.css";

export default function Attendance() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { canAny } = useHrPermissions();
  const canViewAttendance = canAny([...HR_PERMISSION_KEYS.ATTENDANCE.VIEW]);
  const canManageAttendance = canAny([...HR_PERMISSION_KEYS.ATTENDANCE.CREATE]);

  useEffect(() => {
    if (!canViewAttendance) return;

    hrService
      .getEmployees()
      .then((r) => {
        const d = r.data;
        const list = d?.data?.data || d?.data || d;
        setEmployees(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [canViewAttendance]);

  useEffect(() => {
    if (!canViewAttendance) return;
    if (!selectedEmployee) return;
    fetchRecords();
    fetchStats();
  }, [selectedEmployee, month, year, canViewAttendance]);

  if (!canViewAttendance) {
    return (
      <div className="attendance-container">
        <AccessDeniedState
          title="Attendance is restricted"
          description="You do not have permission to view attendance data."
        />
      </div>
    );
  }

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await hrService.getEmployeeAttendance(selectedEmployee);
      const d = res.data;
      const list = d?.data?.data || d?.data || d;
      setRecords(Array.isArray(list) ? list : []);
      setError(null);
    } catch {
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await hrService.getAttendanceStats(
        selectedEmployee,
        month,
        year,
      );
      setStats(res.data.data || res.data);
    } catch {
      setStats(null);
    }
  };

  const handleCheckIn = async () => {
    if (!canManageAttendance) {
      hrToast.warning("You do not have permission to manage attendance records.");
      return;
    }

    if (!selectedEmployee) {
      hrToast.info("Select an employee first");
      return;
    }
    try {
      await hrService.checkIn({
        employeeId: selectedEmployee,
        checkInTime: new Date().toISOString(),
      });
      hrToast.success("Check-in successful!");
      fetchRecords();
    } catch (err: any) {
      hrToast.error(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    if (!canManageAttendance) {
      hrToast.warning("You do not have permission to manage attendance records.");
      return;
    }

    if (!selectedEmployee) {
      hrToast.info("Select an employee first");
      return;
    }
    try {
      await hrService.checkOut({
        employeeId: selectedEmployee,
        checkOutTime: new Date().toISOString(),
      });
      hrToast.success("Check-out successful!");
      fetchRecords();
    } catch (err: any) {
      hrToast.error(err.response?.data?.message || "Check-out failed");
    }
  };

  const handleMarkAbsence = async () => {
    if (!canManageAttendance) {
      hrToast.warning("You do not have permission to manage attendance records.");
      return;
    }

    if (!selectedEmployee) {
      hrToast.info("Select an employee first");
      return;
    }
    const reason = prompt("Enter absence reason:");
    try {
      await hrService.markAbsence({
        employeeId: selectedEmployee,
        date: new Date().toISOString().split("T")[0],
        reason: reason || undefined,
      });
      hrToast.success("Absence recorded!");
      fetchRecords();
    } catch (err: any) {
      hrToast.error(err.response?.data?.message || "Failed to mark absence");
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="bi bi-clock-history me-3"></i>Attendance
          </h1>
          <p className="page-subtitle">
            Track employee check-ins, check-outs, and attendance records
          </p>
        </div>
      </div>

      {/* Employee Selector */}
      <div className="attendance-controls">
        <div className="control-group" style={{ flex: 1, minWidth: 250 }}>
          <label>Employee</label>
          <select
            className="form-select"
            style={{ borderRadius: 8 }}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select an employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Month</label>
          <select
            className="form-select"
            style={{ borderRadius: 8, width: 120 }}
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString("default", {
                  month: "short",
                })}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Year</label>
          <input
            type="number"
            className="form-control"
            style={{ borderRadius: 8, width: 100 }}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          />
        </div>
      </div>

      {selectedEmployee && (
        <>
          {/* Quick Actions */}
          {canManageAttendance && (
            <div className="attendance-actions">
              <div className="action-card" onClick={handleCheckIn}>
                <div className="action-icon check-in">
                  <i className="bi bi-box-arrow-in-right"></i>
                </div>
                <div className="action-text">
                  <h4>Check In</h4>
                  <p>Record arrival time</p>
                </div>
              </div>
              <div className="action-card" onClick={handleCheckOut}>
                <div className="action-icon check-out">
                  <i className="bi bi-box-arrow-right"></i>
                </div>
                <div className="action-text">
                  <h4>Check Out</h4>
                  <p>Record departure time</p>
                </div>
              </div>
              <div className="action-card" onClick={handleMarkAbsence}>
                <div className="action-icon absence">
                  <i className="bi bi-calendar-x"></i>
                </div>
                <div className="action-text">
                  <h4>Mark Absence</h4>
                  <p>Record employee absence</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalDays ?? "—"}</div>
                <div className="stat-label">Total Days</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.presentDays ?? "—"}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.absentDays ?? "—"}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalHours ?? "—"}</div>
                <div className="stat-label">Total Hours</div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Records Table */}
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : records.length > 0 ? (
                  records.map((r: any, i: number) => (
                    <tr key={i}>
                      <td>
                        {r.date ? new Date(r.date).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        {r.checkInTime
                          ? new Date(r.checkInTime).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td>
                        {r.checkOutTime
                          ? new Date(r.checkOutTime).toLocaleTimeString()
                          : "—"}
                      </td>
                      <td>{r.totalHours != null ? `${r.totalHours}h` : "—"}</td>
                      <td>
                        <span
                          className={`status-badge status-${r.status || "ACTIVE"}`}
                        >
                          {r.status || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: "#95a5a6",
                      }}
                    >
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
