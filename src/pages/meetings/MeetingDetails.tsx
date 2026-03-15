import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as meetingService from '../../services/meetingService';
import type { Meeting, ParticipantResponse } from '../../services/meetingService';
import './meetings.css';

export function MeetingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMeeting();
    }
  }, [id]);

  const loadMeeting = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await meetingService.getMeetingById(id);
      setMeeting(data);
      setError(null);
    } catch (err) {
      setError('Failed to load meeting details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResponseBadgeClass = (response?: ParticipantResponse) => {
    switch (response) {
      case 'ACCEPTED': return 'bg-success';
      case 'DECLINED': return 'bg-danger';
      case 'TENTATIVE': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-success';
      case 'DRAFT': return 'bg-warning text-dark';
      case 'CANCELLED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-exclamation-triangle display-1 text-warning opacity-50"></i>
        </div>
        <h4 className="text-muted mb-3">Meeting Not Found</h4>
        <p className="text-muted mb-4">{error || 'The meeting you are looking for does not exist.'}</p>
        <button 
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/meetings')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Meetings
        </button>
      </div>
    );
  }

  return (
    <div className="meetings-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2 fw-bold text-dark">
            <i className="bi bi-calendar-event me-3 text-dark"></i>
            {meeting.title}
          </h2>
          <div className="d-flex align-items-center gap-3">
            <span className={`badge px-3 py-2 ${getStatusBadgeClass(meeting.status)}`}>
              {meeting.status}
            </span>
            <span className="text-muted">
              <i className="bi bi-person me-1"></i>
              Created by {meeting.createdBy}
            </span>
          </div>
        </div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/meetings')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Meetings
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Meeting Overview */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header section-header py-4">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Meeting Overview
              </h5>
            </div>
            <div className="card-body p-4">
              {meeting.description && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2 text-dark">Description</h6>
                  <p className="text-muted mb-0">{meeting.description}</p>
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 time-circle" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-semibold text-dark">Start Time</h6>
                      <p className="text-muted mb-0">{formatDateTime(meeting.startTime)}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 time-circle" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-calendar-x"></i>
                    </div>
                    <div>
                      <h6 className="mb-1 fw-semibold text-dark">End Time</h6>
                      <p className="text-muted mb-0">{formatDateTime(meeting.endTime)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {meeting.zoomJoinUrl && (
                <div className="mt-4 p-4 rounded-3 bg-secondary bg-opacity-10">
                  <h6 className="fw-semibold mb-3 text-dark">
                    <i className="bi bi-camera-video me-2 text-dark"></i>
                    Zoom Meeting
                  </h6>
                  <div className="d-flex flex-wrap gap-3 align-items-center">
                    <a 
                      href={meeting.zoomJoinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-dark btn-lg"
                    >
                      <i className="bi bi-camera-video me-2"></i>
                      Join Meeting
                    </a>
                    <div className="text-muted small">
                      {meeting.zoomMeetingId && (
                        <div className="mb-1">
                          <strong>Meeting ID:</strong> <code>{meeting.zoomMeetingId}</code>
                        </div>
                      )}
                      {meeting.zoomPassword && (
                        <div>
                          <strong>Password:</strong> <code>{meeting.zoomPassword}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          {meeting.participants && meeting.participants.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header section-header py-4">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Participants ({meeting.participants.length})
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  {meeting.participants.map((participant) => (
                    <div key={participant.id} className="col-md-6">
                      <div className="d-flex align-items-center p-3 bg-light rounded-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3 participant-circle" style={{ width: '40px', height: '40px' }}>
                          <i className="bi bi-person-fill text-white"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-semibold text-dark">
                            {participant.userId}
                          </h6>
                          <small className="text-muted">
                            Added {new Date(participant.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <span className={`badge ${getResponseBadgeClass(participant.response)}`}>
                          {participant.response || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Organizers */}
          {meeting.organizers && meeting.organizers.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header section-header py-4">
                <h5 className="mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Organizers ({meeting.organizers.length})
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  {meeting.organizers.map((organizer) => (
                    <div key={organizer.id} className="col-md-6">
                      <div className="d-flex align-items-center p-3 bg-light rounded-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-dark"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <i className="bi bi-person-badge-fill text-white"></i>
                        </div>
                        <div>
                          <h6 className="mb-1 fw-semibold text-dark">
                            {organizer.userId}
                          </h6>
                          <small className="text-muted">Organizer</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agenda Items */}
          {meeting.agendaItems && meeting.agendaItems.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header section-header py-4">
                <h5 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Agenda ({meeting.agendaItems.length} items)
                </h5>
              </div>
              <div className="card-body p-4">
                {meeting.agendaItems.map((item, index) => (
                  <div key={item.id} className="d-flex align-items-center p-3 mb-3 bg-light rounded-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 agenda-number text-white" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                      {index + 1}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0 fw-semibold text-dark">
                        {item.title}
                      </h6>
                    </div>
                    {item.durationMinutes && (
                      <span className="badge bg-secondary">
                        {item.durationMinutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meeting Minutes */}
          {meeting.minutes && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header section-header py-4">
                <h5 className="mb-0">
                  <i className="bi bi-journal-text me-2"></i>
                  Meeting Minutes
                </h5>
              </div>
              <div className="card-body p-4">
                {meeting.minutes.notes && (
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-2 text-dark">Notes</h6>
                    <p className="text-muted">{meeting.minutes.notes}</p>
                  </div>
                )}
                {meeting.minutes.decisions && (
                  <div>
                    <h6 className="fw-semibold mb-2 text-dark">Decisions</h6>
                    <p className="text-muted">{meeting.minutes.decisions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Items */}
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header section-header py-4">
                <h5 className="mb-0">
                  <i className="bi bi-check-square me-2"></i>
                  Action Items ({meeting.actionItems.length})
                </h5>
              </div>
              <div className="card-body p-4">
                {meeting.actionItems.map((item) => (
                  <div key={item.id} className="d-flex align-items-start p-3 mb-3 bg-light rounded-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center me-3 mt-1 action-circle" style={{ width: '32px', height: '32px' }}>
                      <i className="bi bi-check text-white"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold text-dark">
                        {item.title}
                      </h6>
                      <div className="d-flex flex-wrap gap-2 text-muted small">
                        <span>
                          <i className="bi bi-person me-1"></i>
                          {item.assignedToUserId}
                        </span>
                        {item.dueDate && (
                          <span>
                            <i className="bi bi-calendar me-1"></i>
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${item.status === 'COMPLETED' ? 'bg-success' : item.status === 'IN_PROGRESS' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header meeting-info-header py-4">
              <h6 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Meeting Information
              </h6>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-person me-2 text-dark"></i>
                  <strong className="small">Created by</strong>
                </div>
                <p className="text-muted mb-0 ms-4">{meeting.createdBy}</p>
              </div>
              
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-calendar-plus me-2 text-dark"></i>
                  <strong className="small">Created at</strong>
                </div>
                <p className="text-muted mb-0 ms-4">
                  {new Date(meeting.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div>
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-pencil me-2 text-dark"></i>
                  <strong className="small">Last updated</strong>
                </div>
                <p className="text-muted mb-0 ms-4">
                  {new Date(meeting.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
