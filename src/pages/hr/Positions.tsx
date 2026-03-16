  import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/Departments.css';

export function Positions() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await hrService.getPositions();
        const list = res.data?.data || res.data || [];
        if (mounted) {
          setPositions(list);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching positions:', err);
        if (mounted) setError('Failed to load positions');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreatePosition = () => navigate('/dashboard/hr/positions/create');
  const handleEditPosition = (id: string) => navigate(`/dashboard/hr/positions/${id}/edit`);
  const handleDeletePosition = async (id: string) => {
    try {
      await hrService.deletePosition(id);
      setPositions((p) => p.filter((x) => x.id !== id));
      alert('Position deleted');
    } catch (err) {
      console.error('Error deleting position:', err);
      setError('Failed to delete position');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  const filtered = positions.filter((pos) =>
    (pos.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pos.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pos.id || '').toLowerCase().includes(searchTerm.toLowerCase())
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
            <p className="page-subtitle">Manage job positions and roles</p>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleCreatePosition}>
          <i className="bi bi-plus-circle me-2"></i>
          New Position
        </button>
      </div>

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
        <button className="btn btn-outline-secondary" onClick={() => console.log('Filter clicked')}>
          <i className="bi bi-funnel me-2"></i>
          Filter
        </button>
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
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          <div className="departments-grid">
            {filtered && filtered.length > 0 ? (
              filtered.map((pos) => (
                <div key={pos.id} className="department-card-wrapper">
                  <div className="department-card">
                    <div className="card-header">
                      <div className="header-top">
                        <h3 className="card-title">{pos.title || 'Untitled'}</h3>
                        <span className="code-badge">{pos.code || pos.id}</span>
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
                          <label><i className="bi bi-building"></i> Department</label>
                          <p>{pos.departmentId || 'N/A'}</p>
                        </div>
                        <div className="info-item">
                          <label><i className="bi bi-bar-chart"></i> Grade</label>
                          <p>{pos.gradeLevel || 'N/A'}</p>
                        </div>
                        <div className="info-item">
                          <label><i className="bi bi-cash-stack"></i> Salary Band</label>
                          <p className="cost-center-badge">{pos.salaryBandMin || '-'} - {pos.salaryBandMax || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditPosition(pos.id)}>
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </button>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-danger dropdown-toggle" type="button" data-bs-toggle="dropdown">
                          <i className="bi bi-trash me-1"></i>
                          Delete
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <a className="dropdown-item text-danger" href="#!">
                              <strong>Are you sure?</strong>
                            </a>
                          </li>
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeletePosition(pos.id)}>
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
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-state">
                <i className="bi bi-inbox"></i>
                <h3>No positions found</h3>
                <p>{searchTerm ? 'Try adjusting your search criteria' : 'Create your first position to get started'}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Positions;

