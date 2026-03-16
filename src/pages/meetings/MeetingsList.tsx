import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as meetingService from '../../services/meetingService';
import type { Meeting, MeetingStatus } from '../../services/meetingService';
import './meetings.css';

export function MeetingsList() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'ALL'>('ALL');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      
      const data = await meetingService.getMeetings();
      console.log('Meetings loaded:', data);
      setMeetings(Array.isArray(data) ? data : []);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Error loading meetings:', err);
      
      // More detailed error handling
      if (err?.response?.status === 401) {
        setError('Authentication failed: Service ticket is missing or invalid. Please contact support.');
      } else if (err?.response?.status === 500) {
        setError('Meeting service is experiencing technical difficulties. The backend team has been notified. Please try again in a few minutes.');
      } else if (err?.response?.status === 503) {
        setError('Meeting service is temporarily unavailable for maintenance. Please try again later.');
      } else if (err?.response?.status === 404) {
        setError('Meeting service endpoint not found. Please contact support.');
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network Error')) {
        setError('Unable to connect to meeting service. Please check your internet connection and try again.');
      } else if (err?.code === 'ECONNREFUSED') {
        setError('Meeting service is not responding. Please try again later.');
      } else {
        setError(`Failed to load meetings: ${err?.message || 'Unknown error'}. Please try again or contact support if the issue persists.`);
      }
      
      // Set empty array so the UI can still render
      setMeetings([]);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = async () => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // Exponential backoff: wait longer between retries
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 10000);
    
    if (newRetryCount <= 3) {
      setTimeout(() => {
        loadMeetings(true);
      }, delay);
    } else {
      loadMeetings(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await meetingService.deleteMeeting(id);
      loadMeetings();
    } catch (err) {
      console.error('Failed to delete meeting:', err);
      alert('Failed to delete meeting');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    
    try {
      await meetingService.cancelMeeting(id);
      loadMeetings();
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
      alert('Failed to cancel meeting');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: MeetingStatus) => {
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
          <p className="text-muted mt-3">Loading meetings...</p>
        </div>
      </div>
    );
  }

  // Client-side filtering
  const filteredMeetings = statusFilter === 'ALL' 
    ? meetings 
    : meetings.filter(m => m.status === statusFilter);

  // Debug logging for filters
  console.log('Filter Debug:', {
    statusFilter,
    totalMeetings: meetings.length,
    filteredMeetings: filteredMeetings.length,
    meetingStatuses: meetings.map(m => ({ title: m.title, status: m.status }))
  });

  return (
    <div className="meetings-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2 fw-bold text-dark">
            <i className="bi bi-calendar-event me-3 text-dark"></i>
            Meetings
            {error && (
              <span className="badge bg-warning text-dark ms-3">
                <i className="bi bi-wifi-off me-1"></i>
                Offline Mode
              </span>
            )}
          </h2>
          <p className="text-muted mb-0">
            {error 
              ? "Service unavailable - working in offline mode" 
              : "Schedule and manage team meetings"
            }
          </p>
        </div>
        <button 
          className="btn btn-meetings-primary btn-lg shadow-sm"
          onClick={() => navigate('/meetings/create')}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Create Meeting
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${statusFilter === 'ALL' ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              <i className="bi bi-list me-2"></i>All
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'SCHEDULED' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setStatusFilter('SCHEDULED')}
            >
              <i className="bi bi-check-circle me-2"></i>Scheduled
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'DRAFT' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setStatusFilter('DRAFT')}
            >
              <i className="bi bi-pencil me-2"></i>Draft
            </button>
            <button
              type="button"
              className={`btn ${statusFilter === 'CANCELLED' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setStatusFilter('CANCELLED')}
            >
              <i className="bi bi-x-circle me-2"></i>Cancelled
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning border-0 shadow-sm" role="alert">
          <div className="d-flex align-items-start justify-content-between">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Service Unavailable</strong>
                {retryCount > 0 && (
                  <span className="badge bg-secondary ms-2">
                    Attempt {retryCount}/3
                  </span>
                )}
              </div>
              <p className="mb-2 small">{error}</p>
              {retryCount >= 3 && (
                <div className="alert alert-info border-0 mt-2 mb-0 py-2">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    If the issue persists, the backend service may be down. 
                    You can still create meetings offline - they will sync when the service is restored.
                  </small>
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-warning btn-sm"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Retrying...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Retry {retryCount >= 3 ? 'Now' : `(${retryCount + 1}/3)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meetings Grid */}
      <div className="row g-4">
        {filteredMeetings.map((meeting) => (
          <div key={meeting.id} className="col-md-6 col-xl-4">
            <div className="card border-0 shadow-sm h-100 hover-card">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0 fw-bold text-dark">
                    {meeting.title}
                  </h5>
                  <span className={`badge ${getStatusBadgeClass(meeting.status)} px-3 py-2`}>
                    {meeting.status}
                  </span>
                </div>

                {meeting.description && (
                  <p className="card-text text-muted small mb-3 line-clamp-2">
                    {meeting.description}
                  </p>
                )}

                <div className="mb-4">
                  <div className="d-flex align-items-center text-muted small mb-2">
                    <i className="bi bi-calendar-event me-2 text-primary"></i>
                    <span>{formatDateTime(meeting.startTime)}</span>
                  </div>
                  <div className="d-flex align-items-center text-muted small mb-2">
                    <i className="bi bi-clock me-2 text-primary"></i>
                    <span>Until {formatDateTime(meeting.endTime)}</span>
                  </div>
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div className="d-flex align-items-center text-muted small">
                      <i className="bi bi-people me-2 text-primary"></i>
                      <span>{meeting.participants.length} participant(s)</span>
                    </div>
                  )}
                </div>

                {meeting.zoomJoinUrl && (
                  <div className="mb-3">
                    <a 
                      href={meeting.zoomJoinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm w-100"
                    >
                      <i className="bi bi-camera-video me-2"></i>
                      Join Zoom Meeting
                    </a>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary flex-fill"
                    onClick={() => navigate(`/meetings/${meeting.id}`)}
                  >
                    <i className="bi bi-eye me-1"></i>
                    View Details
                  </button>
                  {meeting.status !== 'CANCELLED' && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleCancel(meeting.id)}
                        title="Cancel meeting"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(meeting.id)}
                        title="Delete meeting"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMeetings.length === 0 && !loading && (
        <div className="text-center py-5">
          <div className="mb-4">
            {error ? (
              <i className="bi bi-wifi-off display-1 text-warning"></i>
            ) : (
              <i className="bi bi-calendar-x display-1 text-muted"></i>
            )}
          </div>
          <h4 className="text-muted mb-3">
            {error ? 'Service Unavailable' : 'No meetings found'}
          </h4>
          <p className="text-muted mb-4">
            {error 
              ? "The meeting service is currently unavailable, but you can still create meetings offline"
              : statusFilter === 'ALL' 
                ? "You haven't created any meetings yet" 
                : `No ${statusFilter.toLowerCase()} meetings found`
            }
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/meetings/create')}
            >
              <i className="bi bi-plus-circle me-2"></i>
              {error ? 'Create Meeting Offline' : 'Create Your First Meeting'}
            </button>
            {error && (
              <button 
                className="btn btn-outline-primary btn-lg"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Checking Service...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Check Service Status
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .hover-card {
          transition: all 0.3s ease;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
