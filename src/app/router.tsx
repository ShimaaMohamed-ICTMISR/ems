// src/app/router.tsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import Login from "../pages/Login";
import { ProtectedRoute } from "./ProtectedRoute";
import { PermissionRoute } from "./PermissionRoute";
import { MEETING_PERMISSION_KEYS } from "../config/meetingPermissions";
import { HR_PERMISSION_KEYS, HR_ROUTE_PERMISSION_KEYS } from "../config/hrPermissions";
import { PM_PERMISSION_KEYS, PM_ROUTE_PERMISSION_KEYS } from "../config/projectManagementPermissions";
import {
  Dashboard,
  Notifications,
  HumanResources,
  Portfolios,
  CreateProject,
  ProjectDetails,
  ProjectDocuments,
  TaskDetails,
  AuditLog,
  Workflows,
  Settings,
  Profile,
  Permissions,
  Roles,
  Users,
  ProjectManagement,
  QuickTasks,
  Resources,
  ResourceRequests,
} from "../pages";
import {
  Departments,
  CreateDepartment,
  EditDepartment,
  Positions,
  CreatePosition,
  EditPosition,
  Employees,
  CreateEmployee,
  EditEmployee,
  Attendance,
  LeaveTypes,
  CreateLeaveType,
  LeaveRequests,
  CreateLeaveRequest,
  LeaveBalances,
} from "../pages/hr";
import { MeetingsList, CreateMeeting, MeetingDetails } from "../pages/meetings";
import { PollsDashboard } from "../modules/voting/pages/PollsDashboard";
import { CreatePollPage } from "../modules/voting/pages/CreatePollPage";
import { PollDetailsPage } from "../modules/voting/pages/PollDetailsPage";
import { VotePage } from "../modules/voting/pages/VotePage";
import { ResultsPage } from "../modules/voting/pages/ResultsPage";
import { OpportunityRoutes } from "../modules/opportunities/routes/opportunityRoutes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "notifications", element: <Notifications /> },
      {
        path: "hr",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.HR_HOME]}>
            <HumanResources />
          </PermissionRoute>
        ),
      },
      // Departments
      {
        path: "hr/departments",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.DEPARTMENTS]}>
            <Departments />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/departments/create",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.DEPARTMENTS.CREATE]}>
            <CreateDepartment />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/departments/:id/edit",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.DEPARTMENTS.EDIT]}>
            <EditDepartment />
          </PermissionRoute>
        ),
      },
      // Positions
      {
        path: "hr/positions",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.POSITIONS]}>
            <Positions />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/positions/create",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.POSITIONS.CREATE]}>
            <CreatePosition />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/positions/:id/edit",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.POSITIONS.EDIT]}>
            <EditPosition />
          </PermissionRoute>
        ),
      },
      // Employees
      {
        path: "hr/employees",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.EMPLOYEES]}>
            <Employees />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/employees/create",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.EMPLOYEES.CREATE]}>
            <CreateEmployee />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/employees/:id/edit",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.EMPLOYEES.EDIT]}>
            <EditEmployee />
          </PermissionRoute>
        ),
      },
      // Attendance
      {
        path: "hr/attendance",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.ATTENDANCE]}>
            <Attendance />
          </PermissionRoute>
        ),
      },
      // Leave Types
      {
        path: "hr/leave-types",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.LEAVE_TYPES]}>
            <LeaveTypes />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/leave-types/create",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.LEAVE_TYPES.CREATE]}>
            <CreateLeaveType />
          </PermissionRoute>
        ),
      },
      // Leave Requests
      {
        path: "hr/leave-requests",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.LEAVE_REQUESTS]}>
            <LeaveRequests />
          </PermissionRoute>
        ),
      },
      {
        path: "hr/leave-requests/create",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_PERMISSION_KEYS.LEAVE_REQUESTS.CREATE]}>
            <CreateLeaveRequest />
          </PermissionRoute>
        ),
      },
      // Leave Balances
      {
        path: "hr/leave-balances",
        element: (
          <PermissionRoute scope="hr" anyOf={[...HR_ROUTE_PERMISSION_KEYS.LEAVE_BALANCES]}>
            <LeaveBalances />
          </PermissionRoute>
        ),
      },
      {
        path: "portfolios",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.PORTFOLIOS]}
          >
            <Portfolios />
          </PermissionRoute>
        ),
      },
      {
        path: "project-management",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.HOME]}
          >
            <ProjectManagement />
          </PermissionRoute>
        ),
      },
      {
        path: "project-management/quick-tasks",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.QUICK_TASKS]}
          >
            <QuickTasks />
          </PermissionRoute>
        ),
      },
      {
        path: "project-management/portfolios",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.PORTFOLIOS]}
          >
            <Portfolios />
          </PermissionRoute>
        ),
      },
      {
        path: "project-management/resources",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.RESOURCES]}
          >
            <Resources />
          </PermissionRoute>
        ),
      },
      {
        path: "project-management/resource-requests",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.RESOURCE_REQUESTS]}
          >
            <ResourceRequests />
          </PermissionRoute>
        ),
      },
      {
        path: "projects/create",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_PERMISSION_KEYS.PROJECTS.CREATE]}
          >
            <CreateProject />
          </PermissionRoute>
        ),
      },
      {
        path: "portfolios/:portfolioId/projects/:projectId",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.PROJECT_DETAILS]}
          >
            <ProjectDetails />
          </PermissionRoute>
        ),
      },
      {
        path: "portfolios/:portfolioId/projects/:projectId/documents",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.PROJECT_DOCUMENTS]}
          >
            <ProjectDocuments />
          </PermissionRoute>
        ),
      },
      {
        path: "portfolios/:portfolioId/projects/:projectId/tasks/:taskId",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.TASK_DETAILS]}
          >
            <TaskDetails />
          </PermissionRoute>
        ),
      },
      {
        path: "tasks/:taskId",
        element: (
          <PermissionRoute
            scope="projectManagement"
            anyOf={[...PM_ROUTE_PERMISSION_KEYS.TASK_DETAILS]}
          >
            <TaskDetails />
          </PermissionRoute>
        ),
      },
      // Meetings
      {
        path: "meetings",
        element: (
          <PermissionRoute anyOf={[...MEETING_PERMISSION_KEYS.VIEW]}>
            <MeetingsList />
          </PermissionRoute>
        ),
      },
      {
        path: "meetings/create",
        element: (
          <PermissionRoute anyOf={[...MEETING_PERMISSION_KEYS.CREATE]}>
            <CreateMeeting />
          </PermissionRoute>
        ),
      },
      {
        path: "meetings/:id",
        element: (
          <PermissionRoute anyOf={[...MEETING_PERMISSION_KEYS.VIEW]}>
            <MeetingDetails />
          </PermissionRoute>
        ),
      },
      // Voting
      {
        path: "voting",
        element: <Outlet />,
        children: [
          { index: true, element: <PollsDashboard /> },
          { path: "create", element: <CreatePollPage /> },
          { path: ":pollId", element: <PollDetailsPage /> },
          { path: ":pollId/vote", element: <VotePage /> },
          { path: ":pollId/results", element: <ResultsPage /> },
        ],
      },
      // Opportunities
      {
        path: "opportunities/*",
        element: <OpportunityRoutes />,
      },
      { path: "audit-log", element: <AuditLog /> },
      { path: "workflows", element: <Workflows /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
      { path: "permissions", element: <Permissions /> },
      { path: "roles", element: <Roles /> },
      { path: "users", element: <Users /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
