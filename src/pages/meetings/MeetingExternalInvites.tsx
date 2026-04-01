import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as meetingService from '../../services/meetingService';
import './meetings.css';

export function MeetingExternalInvites() {
  const navigate = useNavigate();
  const { id: meetingId } = useParams<{ id: string }>();
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const addEmail = () => {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      alert('Please enter a valid email.');
      return;
    }
    if (emails.includes(normalized)) {
      setEmail('');
      return;
    }
    setEmails((prev) => [...prev, normalized]);
    setEmail('');
  };

  const removeEmail = (value: string) => {
    setEmails((prev) => prev.filter((e) => e !== value));
  };

  const sendInvites = async () => {
    if (!meetingId || emails.length === 0) {
      navigate('/dashboard/meetings');
      return;
    }
    try {
      setSending(true);
      const results = await Promise.allSettled(
        emails.map((item) =>
          meetingService.inviteExternalParticipantEmail(meetingId, {
            email: item,
            name: item.split('@')[0],
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        alert(`Invites sent with partial success. Failed: ${failed}`);
      } else {
        alert('External invites sent successfully.');
      }
      navigate('/dashboard/meetings');
    } catch (error) {
      const msg = (error as any)?.response?.data?.message || (error as Error).message || 'Failed to send invites';
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="meetings-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2 fw-bold text-dark">
            <i className="bi bi-envelope-plus me-3 text-dark"></i>
            External Email Invites
          </h2>
          <p className="text-muted mb-0">Meeting was created. Add external recipients and send invitations.</p>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold text-dark">
                <i className="bi bi-envelope me-2"></i>
                Add External Recipients
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="input-group shadow-sm mb-3">
                <input
                  type="email"
                  className="form-control border-0"
                  placeholder="Enter external email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="button" className="btn btn-meetings-primary" onClick={addEmail} disabled={!email.trim()}>
                  <i className="bi bi-plus-circle me-2"></i>Add
                </button>
              </div>

              <div className="border rounded-3 p-3 bg-light mb-4">
                {emails.length === 0 ? (
                  <small className="text-muted">No external emails added yet.</small>
                ) : (
                  emails.map((item) => (
                    <div key={item} className="d-flex justify-content-between align-items-center py-2 px-3 mb-2 bg-white rounded-2 shadow-sm">
                      <span className="fw-medium">{item}</span>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeEmail(item)}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="d-flex gap-3">
                <button type="button" className="btn btn-meetings-primary btn-lg px-4" onClick={sendInvites} disabled={sending}>
                  {sending ? 'Sending...' : 'Send Invites'}
                </button>
                <button type="button" className="btn btn-lg btn-outline-secondary px-4" onClick={() => navigate('/dashboard/meetings')}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
