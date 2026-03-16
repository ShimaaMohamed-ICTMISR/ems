import { useState, useEffect } from 'react';
import * as React from 'react';
import type { PollEligibility } from '../types/voting.types';
import { createEligibility, deleteEligibility } from '../api/votingApi';
import { fetchEmployees, type Employee } from '../services/employeeService';

interface PollEligibilityProps {
  pollId: string;
  eligibility: PollEligibility[];
  onEligibilityChange: () => void;
  readOnly?: boolean;
}

export function PollEligibilityComponent({
  pollId,
  eligibility,
  onEligibilityChange,
  readOnly = false,
}: PollEligibilityProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Employee dropdown states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [eligibilityMode, setEligibilityMode] = useState<'individual' | 'department' | 'role'>('individual');

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const employeeData = await fetchEmployees();
      console.log('Loaded employee data in component:', employeeData);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setError('Failed to load employees. Using manual input instead.');
      setEmployees([]); // Ensure it's always an array
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Filter employees based on search - completely defensive approach
  const filteredEmployees = React.useMemo(() => {
    if (!employeeSearch.trim()) {
      return employees;
    }
    
    const searchLower = employeeSearch.toLowerCase();
    
    return employees.filter(emp => {
      try {
        // Ensure emp is an object
        if (!emp || typeof emp !== 'object') {
          return false;
        }
        
        // Safe string checks
        const nameMatch = emp.name && typeof emp.name === 'string' ? 
          emp.name.toLowerCase().includes(searchLower) : false;
          
        const emailMatch = emp.email && typeof emp.email === 'string' ? 
          emp.email.toLowerCase().includes(searchLower) : false;
          
        const departmentMatch = emp.department && typeof emp.department === 'string' ? 
          emp.department.toLowerCase().includes(searchLower) : false;
          
        const roleMatch = emp.role && typeof emp.role === 'string' ? 
          emp.role.toLowerCase().includes(searchLower) : false;
        
        return nameMatch || emailMatch || departmentMatch || roleMatch;
      } catch (error) {
        console.error('Error filtering employee:', emp, error);
        return false;
      }
    });
  }, [employees, employeeSearch]);

  const handleAddEmployee = async () => {
    if (!selectedEmployee) return;
    
    setError(null);
    setLoading(true);
    
    try {
      let payload: any;
      
      switch (eligibilityMode) {
        case 'individual':
          payload = { userId: selectedEmployee.id };
          break;
        case 'department':
          if (!selectedEmployee.departmentId) {
            throw new Error('Selected employee has no department information');
          }
          payload = { departmentId: selectedEmployee.departmentId };
          break;
        case 'role':
          if (!selectedEmployee.role) {
            throw new Error('Selected employee has no role information');
          }
          payload = { role: selectedEmployee.role };
          break;
      }
      
      await createEligibility(pollId, payload);
      setSelectedEmployee(null);
      setEmployeeSearch('');
      setShowEmployeeDropdown(false);
      onEligibilityChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add eligibility');
    } finally {
      setLoading(false);
    }
  };

  const asText = (eligibility: PollEligibility): { type: string; value: string } => {
    // Handle new format (userId, departmentId, role)
    if (eligibility.userId) {
      return { type: 'User', value: eligibility.userId };
    }
    if (eligibility.departmentId) {
      return { type: 'Department', value: eligibility.departmentId };
    }
    if (eligibility.role) {
      return { type: 'Role', value: eligibility.role };
    }
    // Handle legacy format (type/value)
    if (eligibility.type && eligibility.value) {
      return { type: eligibility.type, value: eligibility.value };
    }
    return { type: 'Unknown', value: 'N/A' };
  };

  const handleDelete = async (eligibilityId: string) => {
    if (!confirm('Remove this eligibility rule?')) return;
    setError(null);
    setLoading(true);
    try {
      await deleteEligibility(pollId, eligibilityId);
      onEligibilityChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poll-eligibility">
      <h6 className="mb-3">
        <i className="bi bi-people me-2"></i>
        Eligibility Rules
      </h6>
      
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      
      {/* Current Eligibility Rules */}
      <div className="mb-4">
        <ul className="list-group list-group-flush">
          {eligibility.length === 0 && (
            <li className="list-group-item text-muted">
              <i className="bi bi-info-circle me-2"></i>
              No eligibility rules set. All users can vote.
            </li>
          )}
          {eligibility.map((e) => {
            const displayInfo = asText(e);
            return (
              <li key={e.id} className="list-group-item d-flex align-items-center">
                <div className="flex-grow-1">
                  <strong>{displayInfo.type}:</strong>{' '}
                  <span className="text-muted">{displayInfo.value}</span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(e.id)}
                    disabled={loading}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {!readOnly && (
        <div className="border-top pt-4">
          <h6 className="mb-3">Add Eligibility Rule</h6>
          
          {/* Employee Dropdown Section */}
          {employees.length > 0 && (
            <div className="mb-4">
              <div className="card">
                <div className="card-header bg-light">
                  <h6 className="mb-0">
                    <i className="bi bi-person-check me-2"></i>
                    Select Employee
                  </h6>
                </div>
                <div className="card-body">
                  {/* Eligibility Mode Selection */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Grant access to:</label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="eligibilityMode"
                        id="individual"
                        checked={eligibilityMode === 'individual'}
                        onChange={() => setEligibilityMode('individual')}
                      />
                      <label className="btn btn-outline-primary btn-sm" htmlFor="individual">
                        <i className="bi bi-person me-1"></i>
                        Individual Only
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="eligibilityMode"
                        id="department"
                        checked={eligibilityMode === 'department'}
                        onChange={() => setEligibilityMode('department')}
                      />
                      <label className="btn btn-outline-primary btn-sm" htmlFor="department">
                        <i className="bi bi-building me-1"></i>
                        Whole Department
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="eligibilityMode"
                        id="role"
                        checked={eligibilityMode === 'role'}
                        onChange={() => setEligibilityMode('role')}
                      />
                      <label className="btn btn-outline-primary btn-sm" htmlFor="role">
                        <i className="bi bi-briefcase me-1"></i>
                        All with Role
                      </label>
                    </div>
                  </div>

                  {/* Employee Search */}
                  <div className="position-relative mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search employees by name, email, department, or role..."
                      value={employeeSearch}
                      onChange={(e) => {
                        setEmployeeSearch(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                    />
                    <i className="bi bi-search position-absolute top-50 end-0 translate-middle-y me-3"></i>
                    
                    {/* Dropdown */}
                    {showEmployeeDropdown && employeeSearch && (
                      <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {loadingEmployees ? (
                          <div className="dropdown-item text-center">
                            <div className="spinner-border spinner-border-sm me-2"></div>
                            Loading employees...
                          </div>
                        ) : filteredEmployees.length === 0 ? (
                          <div className="dropdown-item text-muted">No employees found</div>
                        ) : (
                          filteredEmployees.slice(0, 10).map((employee) => (
                            <button
                              key={employee.id}
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setEmployeeSearch(employee.name);
                                setShowEmployeeDropdown(false);
                              }}
                            >
                              <div className="d-flex align-items-center">
                                <i className="bi bi-person-circle me-2"></i>
                                <div>
                                  <div className="fw-semibold">{employee.name}</div>
                                  <small className="text-muted">
                                    {employee.department && `${employee.department} • `}
                                    {employee.role || employee.email}
                                  </small>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Employee Info */}
                  {selectedEmployee && (
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i>
                        <div className="flex-grow-1">
                          <strong>Selected:</strong> {selectedEmployee.name}
                          {eligibilityMode === 'individual' && (
                            <div><small>Only this employee will be able to vote</small></div>
                          )}
                          {eligibilityMode === 'department' && selectedEmployee.department && (
                            <div><small>All employees in "{selectedEmployee.department}" department will be able to vote</small></div>
                          )}
                          {eligibilityMode === 'role' && selectedEmployee.role && (
                            <div><small>All employees with "{selectedEmployee.role}" role will be able to vote</small></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Button */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddEmployee}
                    disabled={loading || !selectedEmployee}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Eligibility Rule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
