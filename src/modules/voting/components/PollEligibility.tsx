import { useState, useEffect } from 'react';
import type { PollEligibility } from '../types/voting.types';
import { createEligibility } from '../api/votingApi';
import { fetchEmployees, type Employee } from '../services/employeeService';

interface PollEligibilityProps {
  pollId: string;
  eligibility: PollEligibility[];
  onEligibilityChange: () => void;
  readOnly?: boolean;
}

export function PollEligibilityComponent({
  pollId,
  eligibility: _eligibility,
  onEligibilityChange,
  readOnly = false,
}: PollEligibilityProps) {
  void _eligibility;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Employee dropdown states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

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

  const handleAddEmployee = async () => {
    if (!selectedEmployee) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const payload = { userId: selectedEmployee.id };
      await createEligibility(pollId, payload);
      setSelectedEmployee(null);
      onEligibilityChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add eligibility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poll-eligibility">
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      
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
                  {/* Employee Dropdown */}
                  <div className="mb-3">
                    <select
                      className="form-select"
                      value={selectedEmployee?.id ?? ''}
                      onChange={(e) => {
                        const selected = employees.find((emp) => emp.id === e.target.value) ?? null;
                        setSelectedEmployee(selected);
                      }}
                      disabled={loadingEmployees}
                    >
                      <option value="">
                        {loadingEmployees ? 'Loading employees...' : 'Select employee'}
                      </option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                          {employee.email ? ` - ${employee.email}` : ''}
                          {employee.department ? ` - ${employee.department}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Employee Info */}
                  {selectedEmployee && (
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i>
                        <div className="flex-grow-1">
                          <strong>Selected:</strong> {selectedEmployee.name}
                          <div><small>Only this employee will be able to vote</small></div>
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
