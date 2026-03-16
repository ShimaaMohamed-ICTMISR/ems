import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/Employees.css';

export default function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => { fetchEmployees(); }, [page, statusFilter]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const params: any = { page, limit: 10 };
            if (statusFilter) params.status = statusFilter;
            const res = await hrService.getEmployees(params);
            const d = res.data;
            const list = d?.data?.data || d?.data || d;
            setEmployees(Array.isArray(list) ? list : []);
            setTotalPages(d?.totalPages || d?.data?.totalPages || 1);
            setError(null);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to load employees');
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await hrService.deleteEmployee(id);
            setEmployees(employees.filter(e => e.id !== id));
        } catch { setError('Failed to delete employee'); }
    };

    const filtered = employees.filter(e => {
        const term = searchTerm.toLowerCase();
        return (
            (e.firstName + ' ' + e.lastName).toLowerCase().includes(term) ||
            e.employeeCode.toLowerCase().includes(term) ||
            e.email.toLowerCase().includes(term)
        );
    });

    if (loading) {
        return (
            <div className="departments-loading">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="mt-3">Loading employees...</p>
            </div>
        );
    }

    return (
        <div className="employees-container">
            <div className="employees-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-people me-3"></i>Employees</h1>
                    <p className="page-subtitle">Manage employee records and profiles</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/hr/employees/create')}>
                    <i className="bi bi-plus-circle me-2"></i>New Employee
                </button>
            </div>

            <div className="employees-controls">
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input type="text" className="form-control" placeholder="Search by name, code, or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="form-select" style={{ maxWidth: 200, borderRadius: 8 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                </select>
            </div>

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>{error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            <div className="employees-table-wrapper">
                <table className="employees-table">
                    <thead>
                        <tr>
                            <th>Code</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Status</th><th>Hire Date</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(emp => (
                            <tr key={emp.id}>
                                <td><strong>{emp.employeeCode}</strong></td>
                                <td>{emp.firstName} {emp.lastName}</td>
                                <td>{emp.email}</td>
                                <td>{emp.department?.name || emp.departmentId?.substring(0, 8) + '...'}</td>
                                <td>{emp.position?.title || emp.positionId?.substring(0, 8) + '...'}</td>
                                <td><span className={`status-badge status-${emp.status}`}>{emp.status}</span></td>
                                <td>{new Date(emp.hireDate).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}><i className="bi bi-pencil"></i></button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(emp.id)}><i className="bi bi-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>No employees found</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="employees-pagination">
                    <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><i className="bi bi-chevron-left"></i> Prev</button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <i className="bi bi-chevron-right"></i></button>
                </div>
            </div>
        </div>
    );
}

