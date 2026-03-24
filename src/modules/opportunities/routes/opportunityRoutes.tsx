import { Routes, Route } from 'react-router-dom';
import { OpportunitiesDashboard } from '../pages/OpportunitiesDashboard';
import { OpportunityDetailsPage } from '../pages/OpportunityDetailsPage';
import { LeadsPage } from '../pages/LeadsPage';

export function OpportunityRoutes() {
  return (
    <Routes>
      <Route index element={<OpportunitiesDashboard />} />
      <Route path="leads" element={<LeadsPage />} />
      <Route path=":id" element={<OpportunityDetailsPage />} />
    </Routes>
  );
}