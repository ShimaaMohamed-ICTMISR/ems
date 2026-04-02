import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as meetingService from '../../services/meetingService';
import type { CreateMeetingDto } from '../../services/meetingService';
import hrService, { type Employee, type Department } from '../../services/hrProjectManagementService';
import { validateCreateMeeting, validateMeetingTitle, validateMeetingTimes, validateDescription, sanitizeText } from '../../utils/meetingValidation';
import './meetings.css';

function parseNestedList<T>(res: { data?: any }): T[] {
  const root = res.data;
  const layer1 = root?.data;
  const layer2 = layer1?.data;
  const candidates = [layer2, layer1, root, layer1?.employees, layer1?.departments, layer2?.employees, layer2?.departments];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

type ParticipantAddMode = 'users' | 'department';

export function CreateMeeting() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateMeetingDto>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED'  // Changed from DRAFT to SCHEDULED
  });
  const [participantAddMode, setParticipantAddMode] = useState<ParticipantAddMode>('users');
  const [participantUserId, setParticipantUserId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  /** When adding by user: optional filter for the employee dropdown (HR). */
  const [employeeListDepartmentFilter, setEmployeeListDepartmentFilter] = useState('');
  /** When adding by department: target department for bulk add. */
  const [bulkDepartmentId, setBulkDepartmentId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeById, setEmployeeById] = useState<Record<string, Employee>>({});
  const [bulkAdding, setBulkAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    hrService
      .getDepartments({ isActive: true })
      .then((res) => {
        setDepartments(parseNestedList<Department>(res));
      })
      .catch((err) => {
        console.error('Failed to load departments:', err);
        setDepartments([]);
      });
  }, []);

  useEffect(() => {
    if (participantAddMode !== 'users') {
      return;
    }
    const params = employeeListDepartmentFilter
      ? { departmentId: employeeListDepartmentFilter }
      : undefined;
    hrService
      .getEmployees(params)
      .then((res) => {
        const list = parseNestedList<Employee>(res);
        setEmployees(list);
        setEmployeeById((prev) => {
          const next = { ...prev };
          for (const e of list) {
            next[e.id] = e;
          }
          return next;
        });
      })
      .catch((err) => {
        console.error('Failed to load employees for participants dropdown:', err);
        setEmployees([]);
      });
  }, [participantAddMode, employeeListDepartmentFilter]);

  // Validation helper functions
  const validateField = (field: string, value: string) => {
    let error: string | null = null;
    
    switch (field) {
      case 'title':
        error = validateMeetingTitle(value);
        break;
      case 'description':
        error = validateDescription(value);
        break;
      case 'times':
        if (formData.startTime && formData.endTime) {
          error = validateMeetingTimes(formData.startTime, formData.endTime);
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setValidationErrors([]);
      
      // Validate the form data
      const validation = validateCreateMeeting({
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description
      });
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }
      
      // Convert datetime-local format to ISO 8601 with timezone
      const startTime = new Date(formData.startTime).toISOString();
      const endTime = new Date(formData.endTime).toISOString();
      
      const meetingData: CreateMeetingDto = {
        title: sanitizeText(formData.title),
        description: formData.description ? sanitizeText(formData.description) : undefined,
        startTime,
        endTime,
      };
      if (participants.length > 0) {
        meetingData.participants = participants.map((userId) => ({ userId }));
      }
      
      console.log('Sending meeting data:', meetingData);
      
      const createdMeeting = await meetingService.createMeeting(meetingData);
      navigate(`/dashboard/meetings/${createdMeeting.id}/external-invites`);
    } catch (err) {
      console.error('Failed to create meeting:', err);
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.response?.data?.error ||
        (err as Error)?.message ||
        'Failed to create meeting';
      setValidationErrors([message]);
    } finally {
      setSubmitting(false);
    }
  };

  const addParticipant = () => {
    if (participantUserId && !participants.includes(participantUserId)) {
      setParticipants([...participants, participantUserId]);
      setParticipantUserId('');
    }
  };

  const removeParticipant = (userId: string) => {
    setParticipants(participants.filter(id => id !== userId));
  };

  const mergeEmployeesIntoParticipants = (list: Employee[]) => {
    setParticipants((prev) => {
      const next = new Set(prev);
      for (const e of list) {
        next.add(e.id);
      }
      return Array.from(next);
    });
    setEmployeeById((prev) => {
      const next = { ...prev };
      for (const e of list) {
        next[e.id] = e;
      }
      return next;
    });
  };

  const addAllEmployeesInDepartment = async () => {
    if (!bulkDepartmentId) return;
    try {
      setBulkAdding(true);
      const res = await hrService.getEmployees({ departmentId: bulkDepartmentId });
      const list = parseNestedList<Employee>(res);
      mergeEmployeesIntoParticipants(list);
      setBulkDepartmentId('');
    } catch (e) {
      console.error('Failed to load department employees:', e);
      alert('Could not load employees for this department.');
    } finally {
      setBulkAdding(false);
    }
  };

  return (
    <div className="meetings-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2 fw-bold text-dark">
            <i className="bi bi-plus-circle me-3 text-dark"></i>
            Create Meeting
          </h2>
          <p className="text-muted mb-0">Schedule a new team meeting</p>
        </div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/dashboard/meetings')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Meetings
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-calendar-plus me-2 "></i>
                Meeting Details
              </h5>
            </div>
            <div className="card-body p-4">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="alert alert-danger mb-4">
                  <h6 className="alert-heading mb-2">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Please fix the following errors:
                  </h6>
                  <ul className="mb-0">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-type me-2 text-dark"></i>
                    Title *
                  </label>
                  <input
                    type="text"
                    className={`form-control form-control-lg border-0 shadow-sm ${fieldErrors.title ? 'is-invalid' : ''}`}
                    placeholder="Enter meeting title..."
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      validateField('title', e.target.value);
                    }}
                    onBlur={(e) => validateField('title', e.target.value)}
                    required
                  />
                  {fieldErrors.title && (
                    <div className="invalid-feedback d-block">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {fieldErrors.title}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-text-paragraph me-2 text-dark"></i>
                    Description
                  </label>
                  <textarea
                    className={`form-control border-0 shadow-sm ${fieldErrors.description ? 'is-invalid' : ''}`}
                    rows={4}
                    placeholder="Add meeting description or agenda..."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      validateField('description', e.target.value);
                    }}
                    onBlur={(e) => validateField('description', e.target.value)}
                  />
                  {fieldErrors.description && (
                    <div className="invalid-feedback d-block">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {fieldErrors.description}
                    </div>
                  )}
                  <small className="text-muted">
                    {formData.description?.length || 0}/1000 characters
                  </small>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar-event me-2 text-dark"></i>
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control border-0 shadow-sm ${fieldErrors.times ? 'is-invalid' : ''}`}
                      value={formData.startTime}
                      onChange={(e) => {
                        setFormData({ ...formData, startTime: e.target.value });
                        if (formData.endTime) {
                          validateField('times', e.target.value);
                        }
                      }}
                      onBlur={() => {
                        if (formData.endTime) {
                          validateField('times', formData.startTime);
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar-x me-2 text-dark"></i>
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control border-0 shadow-sm ${fieldErrors.times ? 'is-invalid' : ''}`}
                      value={formData.endTime}
                      min={formData.startTime || undefined}
                      onChange={(e) => {
                        setFormData({ ...formData, endTime: e.target.value });
                        if (formData.startTime) {
                          validateField('times', e.target.value);
                        }
                      }}
                      onBlur={() => {
                        if (formData.startTime) {
                          validateField('times', formData.endTime);
                        }
                      }}
                      required
                    />
                  </div>
                  {fieldErrors.times && (
                    <div className="col-12">
                      <div className="text-danger mb-3">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {fieldErrors.times}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-people me-2 text-dark"></i>
                    Add Participants
                  </label>
                  <div className="mb-2">
                    <label className="form-label small text-muted mb-1">Invite by</label>
                    <select
                      className="form-select border-0 shadow-sm"
                      value={participantAddMode}
                      onChange={(e) => {
                        setParticipantAddMode(e.target.value as ParticipantAddMode);
                        setParticipantUserId('');
                        setBulkDepartmentId('');
                      }}
                    >
                      <option value="users">Specific employees (users)</option>
                      <option value="department">Whole department</option>
                    </select>
                  </div>

                  {participantAddMode === 'users' ? (
                    <>
                      <div className="mb-2">
                        <label className="form-label small text-muted mb-1">Department</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          value={employeeListDepartmentFilter}
                          onChange={(e) => {
                            setEmployeeListDepartmentFilter(e.target.value);
                            setParticipantUserId('');
                          }}
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
                      <div className="input-group shadow-sm">
                        <select
                          className="form-select border-0"
                          value={participantUserId}
                          onChange={(e) => setParticipantUserId(e.target.value)}
                        >
                          <option value="">Select employee...</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} - {emp.email}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-meetings-primary"
                          onClick={addParticipant}
                          disabled={!participantUserId}
                        >
                          <i className="bi bi-plus-circle me-2"></i>Add
                        </button>
                      </div>
                      <small className="text-muted mt-2 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Optional department filter narrows the employee list; add users one by one.
                      </small>
                    </>
                  ) : (
                    <>
                      <div className="mb-2">
                        <label className="form-label small text-muted mb-1">Department</label>
                        <select
                          className="form-select border-0 shadow-sm"
                          value={bulkDepartmentId}
                          onChange={(e) => setBulkDepartmentId(e.target.value)}
                        >
                          <option value="">Select department...</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                              {d.code ? ` (${d.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn btn-meetings-primary"
                        onClick={addAllEmployeesInDepartment}
                        disabled={!bulkDepartmentId || bulkAdding}
                      >
                        {bulkAdding ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                            Loading…
                          </>
                        ) : (
                          <>
                            <i className="bi bi-people-fill me-2"></i>
                            Add all employees in department
                          </>
                        )}
                      </button>
                      <small className="text-muted mt-2 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        Loads all HR users for that department and adds them as meeting participants.
                      </small>
                    </>
                  )}
                </div>

                {participants.length > 0 && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-people-fill me-2 text-dark"></i>
                      Participants ({participants.length})
                    </label>
                    <div className="border rounded-3 p-3 bg-light">
                      {participants.map((userId) => {
                        const emp = employeeById[userId];
                        const displayName = emp
                          ? `${emp.firstName} ${emp.lastName} - ${emp.email}`
                          : userId;
                        return (
                          <div key={userId} className="d-flex justify-content-between align-items-center py-2 px-3 mb-2 bg-white rounded-2 shadow-sm">
                            <div className="d-flex align-items-center">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-primary"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <i className="bi bi-person-fill text-white"></i>
                              </div>
                              <span className="fw-medium">{displayName}</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeParticipant(userId)}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="d-flex gap-3 pt-3">
                  <button 
                    type="submit" 
                    className="btn btn-meetings-primary btn-lg px-4"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Create Meeting
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-lg btn-outline-secondary px-4"
                    onClick={() => navigate('/dashboard/meetings')}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-4">
              <h6 className="mb-0 fw-bold text-dark">
                <i className="bi bi-lightbulb me-2 text-dark"></i>
                Tips & Guidelines
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-check-circle-fill me-3 mt-1 text-success"></i>
                <div>
                  <strong className="d-block mb-1">Clear Titles</strong>
                  <small className="text-muted">Use descriptive titles for easy identification</small>
                </div>
              </div>
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-check-circle-fill me-3 mt-1 text-success"></i>
                <div>
                  <strong className="d-block mb-1">Add Participants</strong>
                  <small className="text-muted">Invite team members by their user ID</small>
                </div>
              </div>
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-check-circle-fill me-3 mt-1 text-success"></i>
                <div>
                  <strong className="d-block mb-1">Draft vs Scheduled</strong>
                  <small className="text-muted">Save as Draft to edit later, or Schedule to send invites</small>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <i className="bi bi-check-circle-fill me-3 mt-1 text-success"></i>
                <div>
                  <strong className="d-block mb-1">Zoom Integration</strong>
                  <small className="text-muted">Zoom meeting links are created automatically</small>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
