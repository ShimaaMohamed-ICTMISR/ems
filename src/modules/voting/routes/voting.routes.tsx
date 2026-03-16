import { Route } from 'react-router-dom';
import { PollsDashboard } from '../pages/PollsDashboard';
import { PollDetailsPage } from '../pages/PollDetailsPage';
import { CreatePollPage } from '../pages/CreatePollPage';
import { VotePage } from '../pages/VotePage';
import { ResultsPage } from '../pages/ResultsPage';

export function VotingRoutes() {
  return (
    <>
      <Route index element={<PollsDashboard />} />
      <Route path="create" element={<CreatePollPage />} />
      <Route path=":pollId" element={<PollDetailsPage />} />
      <Route path=":pollId/vote" element={<VotePage />} />
      <Route path=":pollId/results" element={<ResultsPage />} />
    </>
  );
}
