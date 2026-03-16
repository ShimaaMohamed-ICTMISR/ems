import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreateLeaveTypeRequest } from "../../services/hrProjectManagementService";
import hrService from "../../services/hrProjectManagementService";
import "../styles/LeaveTypes.css";

export default function CreateLeaveType() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateLeaveTypeRequest>({
    name: "",
    code: "",
    description: "",
    daysAllowed: 0,
    requiresApproval: true,
    isPaid: true,
    carryForward: false,
    maxCarryForward: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else if (type === "number") {
      setForm({ ...form, [name]: Number(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await hrService.createLeaveType(form);
      alert("Leave type created successfully!");
      navigate("/hr/leave-types");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create leave type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-type-form-container">
      <div className="departments-header">
        <div className="header-content">
          <h1 className="page-title">
            <i className="bi bi-plus-square me-3"></i>New Leave Type
          </h1>
          <p className="page-subtitle">Configure a new leave type</p>
        </div>
        <button
          className="btn btn-outline-secondary btn-lg"
          onClick={() => navigate("/hr/leave-types")}
        >
          <i className="bi bi-arrow-left me-2"></i>Back
        </button>
      </div>
      <form className="leave-type-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Code *</label>
            <input
              className="form-control"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Days Allowed *</label>
            <input
              className="form-control"
              type="number"
              name="daysAllowed"
              value={form.daysAllowed}
              onChange={handleChange}
              min={0}
              required
            />
          </div>
          <div className="form-group">
            <label>Max Carry Forward</label>
            <input
              className="form-control"
              type="number"
              name="maxCarryForward"
              value={form.maxCarryForward}
              onChange={handleChange}
              min={0}
            />
          </div>
          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                name="requiresApproval"
                checked={form.requiresApproval}
                onChange={handleChange}
              />
              <label>Requires Approval</label>
            </div>
          </div>
          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                name="isPaid"
                checked={form.isPaid}
                onChange={handleChange}
              />
              <label>Paid Leave</label>
            </div>
          </div>
          <div className="form-group">
            <div className="form-check">
              <input
                type="checkbox"
                name="carryForward"
                checked={form.carryForward}
                onChange={handleChange}
              />
              <label>Carry Forward</label>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/hr/leave-types")}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Leave Type"}
          </button>
        </div>
      </form>
    </div>
  );
}
