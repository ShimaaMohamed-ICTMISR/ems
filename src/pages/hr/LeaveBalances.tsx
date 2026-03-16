import { useState, useEffect } from 'react';
import type { Employee } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/LeaveRequests.css';

export default function LeaveBalances() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [balances, setBalances] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        hrService.getEmployees().then(r => {
            console.log('--- LEAVE BALANCES: FETCHING EMPLOYEES ---');
            console.log('Raw API Response:', r);
            const list = r.data?.data?.data || r.data?.data || r.data;
            console.log('Extracted Employee List:', list);
            setEmployees(Array.isArray(list) ? list : []);
        }).catch((err) => {
            console.error('Error fetching employees:', err);
        });
    }, []);

    useEffect(() => {
        if (!selectedEmployee) return;
        fetchBalances();
    }, [selectedEmployee, year]);

    const fetchBalances = async () => {
        setLoading(true);
        try {
            const res = await hrService.getLeaveBalances(selectedEmployee, year);
            const list = res.data?.data?.data || res.data?.data || res.data;
            setBalances(Array.isArray(list) ? list : []);
            setError(null);
        } catch { setError('Failed to load leave balances'); }
        finally { setLoading(false); }
    };

    const getBarClass = (used: number, total: number) => {
        const pct = total > 0 ? (used / total) * 100 : 0;
        if (pct >= 80) return 'high';
        if (pct >= 50) return 'medium';
        return 'low';
    };

    return (
        <div className="leave-balances-container">
            <div className="departments-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-pie-chart me-3"></i>Leave Balances</h1>
                    <p className="page-subtitle">View leave balance breakdown per employee</p>
                </div>
            </div>

            <div className="lb-controls">
                <div className="control-group" style={{ flex: 1, minWidth: 250 }}>
                    <label>Employee</label>
                    <select className="form-select" style={{ borderRadius: 8 }} value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                        <option value="">Select an employee...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                    </select>
                </div>
                <div className="control-group">
                    <label>Year</label>
                    <input type="number" className="form-control" style={{ borderRadius: 8, width: 100 }} value={year} onChange={e => setYear(+e.target.value)} />
                </div>
            </div>

            {error && <div className="alert alert-danger"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}

            {loading ? (
                <div className="departments-loading">
                    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
            ) : selectedEmployee && balances.length > 0 ? (
                <div className="lb-grid">
                    {balances.map((b: any, i: number) => {
                        const total = b.totalDays ?? b.daysAllowed ?? 0;
                        const used = b.usedDays ?? b.daysUsed ?? 0;
                        const remaining = b.remainingDays ?? (total - used);
                        const pct = total > 0 ? (used / total) * 100 : 0;
                        return (
                            <div key={i} className="lb-card">
                                <h4>{b.leaveType?.name || b.leaveTypeName || 'Leave Type'}</h4>
                                <span className="lb-code">{b.leaveType?.code || b.leaveTypeCode || ''}</span>
                                <div className="lb-remaining">{remaining} <span className="lb-total">/ {total} days remaining</span></div>
                                <div className="lb-bar-bg">
                                    <div className={`lb-bar-fill ${getBarClass(used, total)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <div className="lb-stats">
                                    <span>Used: {used} days</span>
                                    <span>{pct.toFixed(0)}% used</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : selectedEmployee ? (
                <div className="no-data-state" style={{ background: 'white', borderRadius: 12, padding: '3rem', textAlign: 'center' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#bdc3c7', display: 'block', marginBottom: '1rem' }}></i>
                    <h3 style={{ color: '#2c3e50' }}>No balances found</h3>
                    <p style={{ color: '#95a5a6' }}>No leave balance data for this employee in {year}</p>
                </div>
            ) : null}
        </div>
    );
}

