import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Employee, LeaveType, CreateLeaveRequestRequest } from '../../services/hrService';
import hrService from '../../services/hrService';
import '../styles/LeaveRequests.css';

export default function CreateLeaveRequest() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [form, setForm] = useState<CreateLeaveRequestRequest>({
        employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '', emergencyContact: '',
    });

    useEffect(() => {
        console.log('Fetching employees and leave types...');
        setDataLoading(true);
        
        Promise.all([
            hrService.getEmployees().then(r => { 
                console.log('Employees API response:', r.data);
                const d = r.data;
                const empList = d?.data?.data || d?.data || d;
                const employees = Array.isArray(empList) ? empList : (empList?.employees || []); 
                console.log('Parsed employees:', employees);
                setEmployees(employees); 
            }).catch(err => { 
                console.error('Failed to fetch employees:', err);
                console.error('Error response:', err.response?.data);
            }),
            hrService.getLeaveTypes().then(r => { 
                console.log('Leave types API response:', r.data);
                const d = r.data;
                const ltList = d?.data || d;
                const leaveTypes = Array.isArray(ltList) ? ltList : [];
                console.log('Parsed leave types:', leaveTypes);
                setLeaveTypes(leaveTypes); 
            }).catch(err => { 
                console.error('Failed to fetch leave types:', err);
                console.error('Error response:', err.response?.data);
            })
        ]).finally(() => {
            setDataLoading(false);
        });
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
                        <select className="form-control" name="employeeId" value={form.employeeId} onChange={handleChange} required disabled={dataLoading}>
                            <option value="">{dataLoading ? 'Loading employees...' : employees.length === 0 ? 'No employees found' : 'Select employee...'}</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Leave Type *</label>
                        <select className="form-control" name="leaveTypeId" value={form.leaveTypeId} onChange={handleChange} required disabled={dataLoading}>
                            <option value="">{dataLoading ? 'Loading leave types...' : leaveTypes.length === 0 ? 'No leave types found' : 'Select leave type...'}</option>
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
