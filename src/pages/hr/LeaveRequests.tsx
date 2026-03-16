import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeaveRequest } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/LeaveRequests.css';

export default function LeaveRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchRequests(); }, [statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const res = await hrService.getLeaveRequests(params);
            const list = res.data?.data || res.data;
            setRequests(Array.isArray(list) ? list : []);
            setError(null);
        } catch { setError('Failed to load leave requests'); }
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        const comments = status === 'REJECTED' ? prompt('Enter rejection reason:') : '';
        try {
            await hrService.updateLeaveRequest(id, { status, approverComments: comments || undefined });
            alert(`Leave request ${status.toLowerCase()} successfully!`);
            fetchRequests();
        } catch (err: any) { alert(err.response?.data?.message || 'Failed to update'); }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this leave request?')) return;
        try {
            await hrService.cancelLeaveRequest(id);
            alert('Leave request cancelled!');
            fetchRequests();
        } catch (err: any) { alert(err.response?.data?.message || 'Failed to cancel'); }
    };

    if (loading) {
        return (
            <div className="departments-loading">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="mt-3">Loading leave requests...</p>
            </div>
        );
    }

    return (
        <div className="leave-requests-container">
            <div className="leave-requests-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-envelope-paper me-3"></i>Leave Requests</h1>
                    <p className="page-subtitle">Review and manage leave requests</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/hr/leave-requests/create')}>
                    <i className="bi bi-plus-circle me-2"></i>New Request
                </button>
            </div>

            <div className="leave-requests-controls">
                <select className="form-select" style={{ maxWidth: 200, borderRadius: 8 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                </select>
            </div>

            {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}

            <div className="lr-table-wrapper">
                <table className="lr-table">
                    <thead>
                        <tr><th>Employee</th><th>Leave Type</th><th>Start</th><th>End</th><th>Days</th><th>Status</th><th>Reason</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? requests.map(r => (
                            <tr key={r.id}>
                                <td>{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : r.employeeId?.substring(0, 8) + '...'}</td>
                                <td>{r.leaveType?.name || r.leaveTypeId?.substring(0, 8) + '...'}</td>
                                <td>{new Date(r.startDate).toLocaleDateString()}</td>
                                <td>{new Date(r.endDate).toLocaleDateString()}</td>
                                <td><strong>{r.daysRequested}</strong></td>
                                <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                                <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                                <td>
                                    <div className="action-btns">
                                        {r.status === 'PENDING' && (
                                            <>
                                                <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(r.id, 'APPROVED')} title="Approve"><i className="bi bi-check-lg"></i></button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleStatusUpdate(r.id, 'REJECTED')} title="Reject"><i className="bi bi-x-lg"></i></button>
                                            </>
                                        )}
                                        {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleCancel(r.id)} title="Cancel"><i className="bi bi-slash-circle"></i></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>No leave requests found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
