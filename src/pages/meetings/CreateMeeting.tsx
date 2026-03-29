import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as meetingService from '../../services/meetingService';
import type { CreateMeetingDto } from '../../services/meetingService';
import hrService, { type Employee } from '../../services/hrProjectManagementService';
import './meetings.css';

export function CreateMeeting() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateMeetingDto>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED'  // Changed from DRAFT to SCHEDULED
  });
  const [participantUserId, setParticipantUserId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    hrService
      .getEmployees()
      .then((res) => {
        // API shape:
        // { success, data: { data: Employee[] } }
        const innerData = res.data?.data;
        const list = Array.isArray(innerData?.data) ? innerData.data : Array.isArray(innerData) ? innerData : [];
        setEmployees(list);
      })
      .catch((err) => {
        console.error('Failed to load employees for participants dropdown:', err);
        setEmployees([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Convert datetime-local format to ISO 8601 with timezone
      const startTime = new Date(formData.startTime).toISOString();
      const endTime = new Date(formData.endTime).toISOString();
      
      const meetingData: CreateMeetingDto = {
        ...formData,
        startTime,
        endTime,
        participants: participants.map(userId => ({ userId }))
      };
      
      console.log('Sending meeting data:', meetingData);
      
      await meetingService.createMeeting(meetingData);
      navigate('/dashboard/meetings');
    } catch (err) {
      console.error('Failed to create meeting:', err);
      alert('Failed to create meeting');
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
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-type me-2 text-dark"></i>
                    Title *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg border-0 shadow-sm"
                    placeholder="Enter meeting title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-text-paragraph me-2 text-dark"></i>
                    Description
                  </label>
                  <textarea
                    className="form-control border-0 shadow-sm"
                    rows={4}
                    placeholder="Add meeting description or agenda..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar-event me-2 text-dark"></i>
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control border-0 shadow-sm"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                      className="form-control border-0 shadow-sm"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-people me-2 text-dark"></i>
                    Add Participants
                  </label>
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
                    Choose employees from the list to invite as participants
                  </small>
                </div>

                {participants.length > 0 && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-people-fill me-2 text-dark"></i>
                      Participants ({participants.length})
                    </label>
                    <div className="border rounded-3 p-3 bg-light">
                      {participants.map((userId) => {
                        const emp = employees.find((e) => e.id === userId);
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
