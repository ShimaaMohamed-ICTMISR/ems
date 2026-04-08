import { Routes, Route } from "react-router-dom";
import { PermissionRoute } from "../../../app/PermissionRoute";
import { OPPORTUNITY_ROUTE_PERMISSION_KEYS } from "../../../config/opportunitiesPermissions";
import { OpportunitiesDashboard } from "../pages/OpportunitiesDashboard";
import { OpportunityDetailsPage } from "../pages/OpportunityDetailsPage";
import { LeadsPage } from "../pages/LeadsPage";

export function OpportunityRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <PermissionRoute
            scope="opportunities"
            anyOf={[...OPPORTUNITY_ROUTE_PERMISSION_KEYS.DASHBOARD]}
            title="Opportunities Dashboard Restricted"
            description="You do not currently have permission to list or view opportunities. Please contact your administrator if you need access."
          >
            <OpportunitiesDashboard />
          </PermissionRoute>
        }
      />
      <Route
        path="leads"
        element={
          <PermissionRoute
            scope="opportunities"
            anyOf={[...OPPORTUNITY_ROUTE_PERMISSION_KEYS.LEADS]}
            title="Leads Access Restricted"
            description="You do not currently have permission to list or view leads. Please contact your administrator if you need access."
          >
            <LeadsPage />
          </PermissionRoute>
        }
      />
      <Route
        path=":id"
        element={
          <PermissionRoute
            scope="opportunities"
            anyOf={[...OPPORTUNITY_ROUTE_PERMISSION_KEYS.DETAILS]}
            title="Opportunity Details Restricted"
            description="You do not currently have permission to view opportunity details. Please contact your administrator if you need access."
          >
            <OpportunityDetailsPage />
          </PermissionRoute>
        }
      />
    </Routes>
  );
}
