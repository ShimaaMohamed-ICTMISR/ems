import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Department, Position, UpdateEmployeeRequest, Employee } from '../../services/hrProjectManagementService';
import hrService from '../../services/hrProjectManagementService';
import { hrToast } from '../../utils/hrToast';
import '../styles/Employees.css';

export default function EditEmployee() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const stateEmployee = (location.state as { employee?: Employee } | undefined)?.employee;
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<UpdateEmployeeRequest>({
        employeeCode: '', firstName: '', lastName: '', email: '',
        departmentId: '', positionId: '', hireDate: '',
        phoneNumber: '', dateOfBirth: '', gender: '', address: '', city: '', country: '', postalCode: '',
        status: 'ACTIVE', emergencyContact: '',
    });

    const applyEmployeeToForm = (employee: any) => {
        if (!employee) return;

        setForm({
            employeeCode: employee.employeeCode || '',
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            email: employee.email || '',
            phoneNumber: employee.phoneNumber || '',
            dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
            gender: employee.gender || '',
            address: employee.address || '',
            city: employee.city || '',
            country: employee.country || '',
            postalCode: employee.postalCode || '',
            departmentId: employee.departmentId || '',
            positionId: employee.positionId || '',
            hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
            status: employee.status || 'ACTIVE',
            emergencyContact: employee.emergencyContact || '',
        });
    };


    useEffect(() => {
        const loadData = async () => {
            if (!id) {
                setError('Missing employee id.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fast path when coming from Employees table navigation.
                if (stateEmployee && stateEmployee.id === id) {
                    applyEmployeeToForm(stateEmployee);
                }

                try {
                    const empRes = await hrService.getEmployeeById(id);
                    const empData = empRes.data;
                    const emp = empData?.data?.data || empData?.data || empData;
                    const employee = Array.isArray(emp) ? emp[0] : emp;

                    if (employee) {
                        applyEmployeeToForm(employee);
                    } else if (!stateEmployee) {
                        setError('Employee data not found.');
                    }
                } catch (employeeFetchError) {
                    // Fallback: some backends fail single-item endpoint but list endpoint still works.
                    const listRes = await hrService.getEmployees();
                    const listData = listRes.data?.data?.data || listRes.data?.data || listRes.data || [];
                    const list = Array.isArray(listData) ? listData : [];
                    const employeeFromList = list.find((item: any) => item.id === id);

                    if (employeeFromList) {
                        applyEmployeeToForm(employeeFromList);
                    } else if (!stateEmployee) {
                        throw employeeFetchError;
                    }
                }

                const [deptRes, posRes] = await Promise.allSettled([
                    hrService.getDepartments(),
                    hrService.getPositions(),
                ]);

                if (deptRes.status === 'fulfilled') {
                    const depts = deptRes.value.data?.data?.data || deptRes.value.data?.data || deptRes.value.data;
                    setDepartments(Array.isArray(depts) ? depts : []);
                } else {
                    setDepartments([]);
                }

                if (posRes.status === 'fulfilled') {
                    const poss = posRes.value.data?.data?.data || posRes.value.data?.data || posRes.value.data;
                    setPositions(Array.isArray(poss) ? poss : []);
                } else {
                    setPositions([]);
                }
            } catch (e) {
                console.error('Failed to load employee for editing:', e);
                setError('Failed to load employee data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, stateEmployee]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await hrService.updateEmployee(id!, form);
            hrToast.success('Employee updated successfully!');
            navigate('/dashboard/hr/employees');
        } catch (err: any) {
            hrToast.error(err.response?.data?.message || 'Failed to update employee');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="departments-loading">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                <p className="mt-3">Loading employee data...</p>
            </div>
        );
    }

    return (
        <div className="employee-form-container">
            <div className="employees-header">
                <div className="header-content">
                    <h1 className="page-title"><i className="bi bi-pencil-square me-3"></i>Edit Employee</h1>
                    <p className="page-subtitle">Update employee information</p>
                </div>
                <button className="btn btn-outline-secondary btn-lg" onClick={() => navigate('/dashboard/hr/employees')}>
                    <i className="bi bi-arrow-left me-2"></i>Back
                </button>
            </div>
            <form className="employee-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger mb-3">{error}</div>}
                <div className="form-grid">
                    <div className="form-group"><label>Employee Code</label><input className="form-control" name="employeeCode" value={form.employeeCode} onChange={handleChange} /></div>
                    <div className="form-group"><label>First Name</label><input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} /></div>
                    <div className="form-group"><label>Last Name</label><input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} /></div>
                    <div className="form-group"><label>Email</label><input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} /></div>
                    <div className="form-group"><label>Phone</label><input className="form-control" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} /></div>
                    <div className="form-group"><label>Date of Birth</label><input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} /></div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
                            <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Department</label>
                        <select className="form-control" name="departmentId" value={form.departmentId} onChange={handleChange}>
                            <option value="">Select...</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Position</label>
                        <select className="form-control" name="positionId" value={form.positionId} onChange={handleChange}>
                            <option value="">Select...</option>
                            {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label>Hire Date</label><input className="form-control" type="date" name="hireDate" value={form.hireDate} onChange={handleChange} /></div>
                    <div className="form-group">
                        <label>Status</label>
                        <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                            <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                            <option value="ON_LEAVE">On Leave</option><option value="SUSPENDED">Suspended</option><option value="TERMINATED">Terminated</option>
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
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
}

