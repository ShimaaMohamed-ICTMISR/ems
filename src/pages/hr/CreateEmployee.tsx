import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Department, Position, CreateEmployeeRequest } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import { hrToast } from '../../utils/hrToast';
import '../styles/Employees.css';

export default function CreateEmployee() {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreateEmployeeRequest>({
        employeeCode: '', firstName: '', lastName: '', email: '',
        departmentId: '', positionId: '', hireDate: '',
        phoneNumber: '', dateOfBirth: '', gender: '', address: '', city: '', country: '', postalCode: '',
        status: 'ACTIVE', emergencyContact: '',
    });

    useEffect(() => {
        hrService.getDepartments().then(r => { const d = r.data?.data || r.data; setDepartments(Array.isArray(d) ? d : []); }).catch(() => { });
        hrService.getPositions().then(r => { const d = r.data?.data || r.data; setPositions(Array.isArray(d) ? d : []); }).catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await hrService.createEmployee(form);
            hrToast.success('Employee created successfully!');
            navigate('/dashboard/hr/employees');
        } catch (err: any) {
            hrToast.error(err.response?.data?.message || 'Failed to create employee');
        } finally { setLoading(false); }
    };

    return (
        <div className="employee-form-container">
            <div className="employees-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-person-plus me-3"></i>New Employee</h1>
                    <p className="page-subtitle">Add a new employee to the directory</p>
                </div>
                <button className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/dashboard/hr/employees')}>
                    <i className="bi bi-arrow-left me-2"></i>Back
                </button>
            </div>
            <form className="employee-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group"><label>Employee Code *</label><input className="form-control" name="employeeCode" value={form.employeeCode} onChange={handleChange} required /></div>
                    <div className="form-group"><label>First Name *</label><input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Last Name *</label><input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Email *</label><input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Phone</label><input className="form-control" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} /></div>
                    <div className="form-group"><label>Date of Birth</label><input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} /></div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
                            <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Department *</label>
                        <select className="form-control" name="departmentId" value={form.departmentId} onChange={handleChange} required>
                            <option value="">Select...</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Position *</label>
                        <select className="form-control" name="positionId" value={form.positionId} onChange={handleChange} required>
                            <option value="">Select...</option>
                            {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label>Hire Date *</label><input className="form-control" type="date" name="hireDate" value={form.hireDate} onChange={handleChange} required /></div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                            <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                    <div className="form-group full-width"><label>Address</label><input className="form-control" name="address" value={form.address} onChange={handleChange} /></div>
                    <div className="form-group"><label>City</label><input className="form-control" name="city" value={form.city} onChange={handleChange} /></div>
                    <div className="form-group"><label>Country</label><input className="form-control" name="country" value={form.country} onChange={handleChange} /></div>
                    <div className="form-group"><label>Postal Code</label><input className="form-control" name="postalCode" value={form.postalCode} onChange={handleChange} /></div>
                    <div className="form-group"><label>Emergency Contact</label><input className="form-control" name="emergencyContact" value={form.emergencyContact} onChange={handleChange} /></div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard/hr/employees')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Employee'}</button>
                </div>
            </form>
        </div>
    );
}

