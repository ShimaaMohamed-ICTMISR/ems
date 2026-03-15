import { Routes, Route } from 'react-router-dom';
import { OpportunitiesDashboard } from '../pages/OpportunitiesDashboard';

export function OpportunityRoutes() {
  return (
    <Routes>
      <Route index element={<OpportunitiesDashboard />} />
      {/* Future routes will be added here:
      <Route path="leads" element={<LeadsPage />} />
      <Route path="leads/create" element={<CreateLeadPage />} />
      <Route path="leads/:id" element={<LeadDetailsPage />} />
      <Route path="create" element={<CreateOpportunityPage />} />
      <Route path="pipeline" element={<PipelinePage />} />
      <Route path="quotes" element={<QuotesPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path=":id" element={<OpportunityDetailsPage />} />
      */}
    </Routes>
  );
}