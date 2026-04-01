import { useState, useEffect } from 'react';
import type { PollEligibility } from '../types/voting.types';
import { createEligibility } from '../api/votingApi';
import hrService, {
  type Employee as HrEmployee,
  type Department,
} from '../../../services/hrProjectManagementService';

interface PollEligibilityProps {
  pollId: string;
  eligibility: PollEligibility[];
  onEligibilityChange: () => void;
  readOnly?: boolean;
}

type RuleMode = 'employee' | 'department';

function parseNestedList<T>(res: { data?: any }): T[] {
  const root = res.data;
  const layer1 = root?.data;
  const layer2 = layer1?.data;

  const candidates = [
    layer2,
    layer1,
    root,
    layer1?.employees,
    layer1?.departments,
    layer2?.employees,
    layer2?.departments,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
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

  const [ruleMode, setRuleMode] = useState<RuleMode>('employee');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [employeeDepartmentFilterId, setEmployeeDepartmentFilterId] = useState('');
  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<HrEmployee | null>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [selectedDepartmentRuleId, setSelectedDepartmentRuleId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingDepartments(true);
    hrService
      .getDepartments({ isActive: true })
      .then((res) => {
        if (!cancelled) setDepartments(parseNestedList<Department>(res));
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDepartments(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ruleMode !== 'employee') return;
    let cancelled = false;
    setLoadingEmployees(true);
    const params = employeeDepartmentFilterId
      ? { departmentId: employeeDepartmentFilterId }
      : undefined;
    hrService
      .getEmployees(params)
      .then((res) => {
        if (!cancelled) {
          setEmployees(parseNestedList<HrEmployee>(res));
          setSelectedEmployee(null);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEmployees([]);
          setError('Failed to load employees.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployees(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ruleMode, employeeDepartmentFilterId]);

  useEffect(() => {
    setSelectedEmployee(null);
    setSelectedDepartmentRuleId('');
    setError(null);
  }, [ruleMode]);

  const handleAddRule = async () => {
    if (ruleMode === 'employee') {
      if (!selectedEmployee) return;
      setError(null);
      setLoading(true);
      try {
        await createEligibility(pollId, { userId: selectedEmployee.id });
        setSelectedEmployee(null);
        onEligibilityChange();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add eligibility');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedDepartmentRuleId) return;
    setError(null);
    setLoading(true);
    try {
      await createEligibility(pollId, { departmentId: selectedDepartmentRuleId });
      setSelectedDepartmentRuleId('');
      onEligibilityChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add eligibility');
    } finally {
      setLoading(false);
    }
  };

  const canAdd =
    ruleMode === 'employee'
      ? Boolean(selectedEmployee)
      : Boolean(selectedDepartmentRuleId);

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

          <div className="mb-3">
            <label className="form-label small text-muted mb-1">Rule applies to</label>
            <select
              className="form-select"
              value={ruleMode}
              onChange={(e) => setRuleMode(e.target.value as RuleMode)}
            >
              <option value="employee">Specific employees (users)</option>
              <option value="department">Whole department</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="card">
              <div className="card-header bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-person-check me-2"></i>
                  {ruleMode === 'employee' ? 'Select employee' : 'Select department'}
                </h6>
              </div>
              <div className="card-body">
                {ruleMode === 'employee' ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">
                        Filter by department (optional)
                      </label>
                      <select
                        className="form-select"
                        value={employeeDepartmentFilterId}
                        onChange={(e) => setEmployeeDepartmentFilterId(e.target.value)}
                        disabled={loadingDepartments}
                      >
                        <option value="">All departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                            {d.code ? ` (${d.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <select
                        className="form-select"
                        value={selectedEmployee?.id ?? ''}
                        onChange={(e) => {
                          const selected =
                            employees.find((emp) => emp.id === e.target.value) ?? null;
                          setSelectedEmployee(selected);
                        }}
                        disabled={loadingEmployees}
                      >
                        <option value="">
                          {loadingEmployees ? 'Loading employees...' : 'Select employee'}
                        </option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName}
                            {employee.email ? ` - ${employee.email}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedEmployee && (
                      <div className="alert alert-info">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-info-circle me-2"></i>
                          <div className="flex-grow-1">
                            <strong>Selected:</strong> {selectedEmployee.firstName}{' '}
                            {selectedEmployee.lastName}
                            <div>
                              <small>Only this employee will be able to vote</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <select
                        className="form-select"
                        value={selectedDepartmentRuleId}
                        onChange={(e) => setSelectedDepartmentRuleId(e.target.value)}
                        disabled={loadingDepartments}
                      >
                        <option value="">
                          {loadingDepartments ? 'Loading departments...' : 'Select department'}
                        </option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                            {d.code ? ` (${d.code})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedDepartmentRuleId && (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Department rule:</strong> all employees in this department can vote
                        (subject to API behavior).
                      </div>
                    )}
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddRule}
                  disabled={loading || !canAdd}
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
        </div>
      )}
    </div>
  );
}
