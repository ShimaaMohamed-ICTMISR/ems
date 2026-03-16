import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/Departments.css';

export default function EditPosition() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // UI-only: would normally fetch position by id to populate the form
  }, [id]);

  return (
    <div className="department-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Edit Position</h2>
          <p className="form-subtitle">Update position details</p>
        </div>

        <form>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Title</label>
              <input type="text" className="form-control" placeholder="e.g., Senior Developer" />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Code</label>
              <input type="text" className="form-control" placeholder="e.g., POS-001" />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea className="form-control" rows={4} placeholder="Position description..." />
            </div>
          </div>

          <div className="form-actions mt-5">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/hr/positions')}>Cancel</button>
            <button type="button" className="btn btn-primary ms-2" onClick={() => navigate('/hr/positions')}>Update Position</button>
          </div>
        </form>
      </div>
    </div>
  );
}
