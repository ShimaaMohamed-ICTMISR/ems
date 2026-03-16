import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Department } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/Departments.css';

export default function CreatePosition() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [depsError, setDepsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [salaryBandMin, setSalaryBandMin] = useState(80000);
  const [salaryBandMax, setSalaryBandMax] = useState(120000);
  const [description, setDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingDeps(true);
        const res = await hrService.getDepartments();
        const list = res.data?.data || res.data || [];
        if (mounted) setDepartments(list);
      } catch (err) {
        console.error('Error loading departments for positions form:', err);
        if (mounted) setDepsError('Failed to load departments');
      } finally {
        if (mounted) setLoadingDeps(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
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
        gradeLevel,
        salaryBandMin,
        salaryBandMax,
        description,
      });
      alert('Position created successfully!');
      navigate('/hr/positions');
    } catch (err) {
      console.error('Error creating position:', err);
      setSubmitError('Failed to create position');
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

        <form>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Title *</label>
              <input type="text" className="form-control" placeholder="e.g., Senior Developer" />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Code *</label>
              <input type="text" className="form-control" placeholder="e.g., POS-001" />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Department Id *</label>
              <select className="form-select" required disabled={loadingDeps}>
                <option value="">{loadingDeps ? 'Loading departments...' : 'Select department'}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
              {depsError && <div className="invalid-feedback d-block">{depsError}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Grade Level</label>
              <select className="form-select">
                <option value="">Select grade level</option>
                <option value="Entry">Entry</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Salary Band Min</label>
              <input type="number" className="form-control" defaultValue={80000} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Salary Band Max</label>
              <input type="number" className="form-control" defaultValue={120000} />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows={4} placeholder="Position description..." />
            </div>
          </div>

          <div className="form-actions mt-5">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/hr/positions')}>Cancel</button>
            <button type="button" className="btn btn-primary ms-2" onClick={() => navigate('/hr/positions')}>Create Position</button>
          </div>
        </form>
      </div>
    </div>
  );
}


