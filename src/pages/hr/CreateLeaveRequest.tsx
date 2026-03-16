import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee, LeaveType, CreateLeaveRequestRequest } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import '../styles/LeaveRequests.css';

export default function CreateLeaveRequest() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreateLeaveRequestRequest>({
        employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '', emergencyContact: '',
    });

    useEffect(() => {
        hrService.getEmployees().then(r => { const d = r.data?.data || r.data; setEmployees(Array.isArray(d) ? d : []); }).catch(() => { });
        hrService.getLeaveTypes().then(r => { const d = r.data?.data || r.data; setLeaveTypes(Array.isArray(d) ? d : []); }).catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await hrService.createLeaveRequest(form);
            alert('Leave request created successfully!');
            navigate('/hr/leave-requests');
        } catch (err: any) { alert(err.response?.data?.message || 'Failed to create leave request'); }
        finally { setLoading(false); }
    };

    return (
        <div className="lr-form-container">
            <div className="leave-requests-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-envelope-plus me-3"></i>New Leave Request</h1>
                    <p className="page-subtitle">Submit a new leave request</p>
                </div>
                <button className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/hr/leave-requests')}>
                    <i className="bi bi-arrow-left me-2"></i>Back
                </button>
            </div>
            <form className="lr-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Employee *</label>
                        <select className="form-control" name="employeeId" value={form.employeeId} onChange={handleChange} required>
                            <option value="">Select employee...</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Leave Type *</label>
                        <select className="form-control" name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange} required>
                            <option value="">Select leave type...</option>
                            {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.daysAllowed}d)</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label>Start Date *</label><input className="form-control" type="date" name="startDate" value={form.startDate} onChange={handleChange} required /></div>
                    <div className="form-group"><label>End Date *</label><input className="form-control" type="date" name="endDate" value={form.endDate} onChange={handleChange} required /></div>
                    <div className="form-group full-width"><label>Reason</label><textarea className="form-control" name="reason" value={form.reason} onChange={handleChange} rows={3} placeholder="Reason for leave..." /></div>
                    <div className="form-group full-width"><label>Emergency Contact</label><input className="form-control" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Contact during leave" /></div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/hr/leave-requests')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
                </div>
            </form>
        </div>
    );
}

