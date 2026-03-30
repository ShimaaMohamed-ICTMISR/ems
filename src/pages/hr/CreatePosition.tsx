import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Department, Position } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/Departments.css';

export default function CreatePosition() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [depsError, setDepsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [parentPositionId, setParentPositionId] = useState('');
  const [inheritsParentPermissions, setInheritsParentPermissions] = useState(true);
  const [salaryBandMin, setSalaryBandMin] = useState(80000);
  const [salaryBandMax, setSalaryBandMax] = useState(120000);
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingDeps(true);
        const [depsRes, posRes] = await Promise.all([
          hrService.getDepartments(),
          hrService.getPositions(),
        ]);
        const depsList = depsRes.data?.data || depsRes.data || [];
        const posList = posRes.data?.data || posRes.data || [];
        if (mounted) {
          setDepartments(depsList);
          setPositions(Array.isArray(posList) ? posList : []);
        }
      } catch (err) {
        console.error('Error loading data for positions form:', err);
        if (mounted) setDepsError('Failed to load form data');
      } finally {
        if (mounted) setLoadingDeps(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!departmentId) {
      setSubmitError('Department is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await hrService.createPosition({
        title,
        code,
        departmentId,
        parentPositionId: parentPositionId || undefined,
        inheritsParentPermissions: parentPositionId ? inheritsParentPermissions : undefined,
        salaryBandMin,
        salaryBandMax,
        description: description || undefined,
      });
      alert('Position created successfully!');
      navigate('/dashboard/hr/positions');
    } catch (err: any) {
      console.error('Error creating position:', err);
      setSubmitError(err.response?.data?.message || 'Failed to create position');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="department-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Create New Position</h2>
          <p className="form-subtitle">Add a new job position</p>
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
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., SWE-SR"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Department *</label>
              <select
                className="form-select"
                required
                disabled={loadingDeps || isSubmitting}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">{loadingDeps ? 'Loading departments...' : 'Select department'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
              {depsError && <div className="invalid-feedback d-block">{depsError}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Parent Position</label>
              <select
                className="form-select"
                disabled={loadingDeps || isSubmitting}
                value={parentPositionId}
                onChange={(e) => setParentPositionId(e.target.value)}
              >
                <option value="">None (top-level position)</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.code})</option>
                ))}
              </select>
              <small className="text-muted">Optional: Create as a mini-position under a parent</small>
            </div>

            {parentPositionId && (
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
                    Inherit parent position permissions
                  </label>
                </div>
              </div>
            )}

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
              {isSubmitting ? 'Creating...' : 'Create Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
