import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Department } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import { hrToast } from '../../utils/hrToast';
import '../styles/Departments.css';

export default function EditPosition() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [loadingPosition, setLoadingPosition] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [salaryBandMin, setSalaryBandMin] = useState<number>(0);
  const [salaryBandMax, setSalaryBandMax] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [inheritsParentPermissions, setInheritsParentPermissions] = useState(true);

  // Load departments
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await hrService.getDepartments();
        const list = res.data?.data || res.data || [];
        if (mounted) setDepartments(list);
      } catch (err) {
        console.error('Error loading departments:', err);
      } finally {
        if (mounted) setLoadingDeps(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Load position data
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoadingPosition(true);
        const res = await hrService.getPositionById(id);
        const pos = res.data?.data || res.data;
        if (mounted && pos) {
          setTitle(pos.title || '');
          setCode(pos.code || '');
          setDepartmentId(pos.departmentId || '');
          setSalaryBandMin(pos.salaryBandMin || 0);
          setSalaryBandMax(pos.salaryBandMax || 0);
          setDescription(pos.description || '');
          setIsActive(pos.isActive !== false);
          setInheritsParentPermissions(pos.inheritsParentPermissions !== false);
        }
      } catch (err) {
        console.error('Error loading position:', err);
        setSubmitError('Failed to load position data');
      } finally {
        if (mounted) setLoadingPosition(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitError(null);

    try {
      setIsSubmitting(true);
      await hrService.updatePosition(id, {
        title,
        description: description || undefined,
        departmentId: departmentId || undefined,
        salaryBandMin: salaryBandMin || undefined,
        salaryBandMax: salaryBandMax || undefined,
        isActive,
        inheritsParentPermissions,
      });
      hrToast.success('Position updated successfully!');
      navigate('/dashboard/hr/positions');
    } catch (err: any) {
      console.error('Error updating position:', err);
      setSubmitError(err.response?.data?.message || 'Failed to update position');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingPosition) {
    return (
      <div className="department-form-container">
        <div className="form-card">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading position...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="department-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Edit Position</h2>
          <p className="form-subtitle">Update position details</p>
        </div>

        {submitError && <div className="alert alert-danger mb-3">{submitError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Senior Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., POS-001"
                value={code}
                disabled
              />
              <small className="text-muted">Code cannot be changed after creation</small>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Department</label>
              <select
                className="form-select"
                disabled={loadingDeps || isSubmitting}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">{loadingDeps ? 'Loading departments...' : 'Select department'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                disabled={isSubmitting}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Salary Band Min</label>
              <input
                type="number"
                className="form-control"
                value={salaryBandMin}
                onChange={(e) => setSalaryBandMin(Number(e.target.value))}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Salary Band Max</label>
              <input
                type="number"
                className="form-control"
                value={salaryBandMax}
                onChange={(e) => setSalaryBandMax(Number(e.target.value))}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="inheritsPermissions"
                  checked={inheritsParentPermissions}
                  onChange={(e) => setInheritsParentPermissions(e.target.checked)}
                  disabled={isSubmitting}
                />
                <label className="form-check-label" htmlFor="inheritsPermissions">
                  Inherits parent permissions
                </label>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Position description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-actions mt-5">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard/hr/positions')}>Cancel</button>
            <button type="submit" className="btn btn-primary ms-2" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
