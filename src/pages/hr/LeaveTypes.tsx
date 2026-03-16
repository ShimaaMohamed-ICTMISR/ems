import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LeaveType } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/LeaveTypes.css';

export default function LeaveTypes() {
    const navigate = useNavigate();
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchLeaveTypes(); }, []);

    const fetchLeaveTypes = async () => {
        try {
            setLoading(true);
            const res = await hrService.getLeaveTypes();
            const list = res.data?.data || res.data;
            setLeaveTypes(Array.isArray(list) ? list : []);
            setError(null);
        } catch { setError('Failed to load leave types'); }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="departments-loading">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="mt-3">Loading leave types...</p>
            </div>
        );
    }

    return (
        <div className="leave-types-container">
            <div className="departments-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-calendar2-week me-3"></i>Leave Types</h1>
                    <p className="page-subtitle">Manage leave type configurations</p>
                </div>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard/hr/leave-types/create')}>
                    <i className="bi bi-plus-circle me-2"></i>New Leave Type
                </button>
            </div>

            {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}

            <div className="leave-types-grid">
                {leaveTypes.length > 0 ? leaveTypes.map(lt => (
                    <div key={lt.id} className="leave-type-card">
                        <div className="lt-header">
                            <h3>{lt.name}</h3>
                            <span className="lt-code">{lt.code}</span>
                        </div>
                        <div className="lt-body">
                            {lt.description && <p style={{ color: '#7f8c8d', fontSize: '.9rem', marginBottom: '1rem' }}>{lt.description}</p>}
                            <div style={{ marginBottom: '1rem' }}>
                                <div className="lt-days">{lt.daysAllowed}</div>
                                <div className="lt-days-label">Days Allowed / Year</div>
                            </div>
                            <div className="lt-badges">
                                <span className={`lt-badge ${lt.isPaid ? 'paid' : 'unpaid'}`}>
                                    <i className={`bi ${lt.isPaid ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
                                    {lt.isPaid ? 'Paid' : 'Unpaid'}
                                </span>
                                {lt.requiresApproval && <span className="lt-badge approval"><i className="bi bi-shield-check"></i>Approval Required</span>}
                                {lt.carryForward && <span className="lt-badge carry"><i className="bi bi-arrow-repeat"></i>Carry Forward{lt.maxCarryForward ? ` (${lt.maxCarryForward}d)` : ''}</span>}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="no-data-state">
                        <i className="bi bi-inbox"></i><h3>No leave types found</h3><p>Create your first leave type to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
