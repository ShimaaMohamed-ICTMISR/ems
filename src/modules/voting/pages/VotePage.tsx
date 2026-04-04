import '../styles/voting.css';
import { useParams } from 'react-router-dom';
import { PollVoteForm } from '../components/PollVoteForm';

export function VotePage() {
  const { pollId } = useParams<{ pollId: string }>();
  if (!pollId) return null;

  return (
    <div className="voting-page">
      <div className="container-fluid py-3">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <PollVoteForm pollId={pollId} />
          </div>
        </div>
      </div>
    </div>
  );
}
