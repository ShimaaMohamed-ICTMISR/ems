import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Department } from '../../services/hrService';
import hrService from '../../services/hrService';
import '../styles/Departments.css';

export function Departments() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await hrService.getDepartments();
      setDepartments(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = () => {
    navigate('/hr/departments/create');
  };

  const handleEditDepartment = (id: string) => {
    navigate(`/hr/departments/${id}/edit`);
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await hrService.deleteDepartment(id);
      setDepartments(departments.filter(d => d.id !== id));
      alert('Department deleted successfully!');
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Failed to delete department');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilter = () => {
    console.log('Filter clicked');
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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
      {/* Header Section */}
      <div className="departments-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">
              <i className="bi bi-building me-3"></i>
              Departments
            </h1>
            <p className="page-subtitle">Manage organization departments and structure</p>
          </div>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleCreateDepartment}
        >
          <i className="bi bi-plus-circle me-2"></i>
          New Department
        </button>
      </div>

      {/* Search and Filter Section */}
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
        <button className="btn btn-outline-secondary" onClick={handleFilter}>
          <i className="bi bi-funnel me-2"></i>
          Filter
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Departments Cards Grid */}
      <div className="departments-grid">
        {filteredDepartments && filteredDepartments.length > 0 ? (
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
                      <p>{dept.head || 'N/A'}</p>
                    </div>
                    <div className="info-item">
                      <label>
                        <i className="bi bi-diagram-3"></i> Parent
                      </label>
                      <p>{dept.parent || 'N/A'}</p>
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
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleEditDepartment(dept.id)}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
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
                        <a className="dropdown-item text-danger" href="#!">
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
                        <button
                          className="dropdown-item"
                        >
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
            <h3>No departments found</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Create your first department to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Departments;
