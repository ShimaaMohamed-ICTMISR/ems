// src/app/router.tsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import Login from "../pages/Login";
import { ProtectedRoute } from "./ProtectedRoute";
import {
  Dashboard,
  Notifications,
  HumanResources,
  Portfolios,
  CreateProject,
  ProjectDetails,
  ProjectDocuments,
  TaskDetails,
  Meetings,
  VotingPolls,
  Projects,
  AuditLog,
  Workflows,
  Settings,
  Profile,
  Permissions,
  Roles,
  Users,
  ProjectManagement,
  Resources,
  ResourceRequests,
} from "../pages";
import {
  Departments, CreateDepartment, EditDepartment,
  Positions, CreatePosition, EditPosition,
  Employees, CreateEmployee, EditEmployee,
  Attendance,
  LeaveTypes, CreateLeaveType,
  LeaveRequests, CreateLeaveRequest,
  LeaveBalances,
} from '../pages/hr';
import { MeetingsList, CreateMeeting, MeetingDetails } from '../pages/meetings';
import { PollsDashboard } from '../modules/voting/pages/PollsDashboard';
import { CreatePollPage } from '../modules/voting/pages/CreatePollPage';
import { PollDetailsPage } from '../modules/voting/pages/PollDetailsPage';
import { VotePage } from '../modules/voting/pages/VotePage';
import { ResultsPage } from '../modules/voting/pages/ResultsPage';
import { OpportunityRoutes } from '../modules/opportunities/routes/opportunityRoutes';

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
      { path: "hr", element: <HumanResources /> },
      { path: "hr/departments", element: <Departments /> },
      { path: "hr/departments/create", element: <CreateDepartment /> },
      { path: "hr/departments/:id/edit", element: <EditDepartment /> },
      { path: "portfolios", element: <Portfolios /> },
      { path: "project-management", element: <ProjectManagement /> },
      { path: "project-management/portfolios", element: <Portfolios /> },
      { path: "project-management/resources", element: <Resources /> },
      {
        path: "project-management/resource-requests",
        element: <ResourceRequests />,
      },
      { path: "projects/create", element: <CreateProject /> },
      {
        path: "portfolios/:portfolioId/projects/:projectId",
        element: <ProjectDetails />,
      },
      {
        path: "portfolios/:portfolioId/projects/:projectId/documents",
        element: <ProjectDocuments />,
      },
      {
        path: "portfolios/:portfolioId/projects/:projectId/tasks/:taskId",
        element: <TaskDetails />,
      },
      { path: "meetings", element: <Meetings /> },
      { path: "voting-polls", element: <VotingPolls /> },
      { path: "audit-log", element: <AuditLog /> },
      { path: "workflows", element: <Workflows /> },
      { path: "settings", element: <Settings /> },
      { path: "profile", element: <Profile /> },
      { path: "permissions", element: <Permissions /> },
      { path: "roles", element: <Roles /> },
      { path: "users", element: <Users /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'hr', element: <HumanResources /> },
      // Departments
      { path: 'hr/departments', element: <Departments /> },
      { path: 'hr/departments/create', element: <CreateDepartment /> },
      { path: 'hr/departments/:id/edit', element: <EditDepartment /> },
      // Positions
      { path: 'hr/positions', element: <Positions /> },
      { path: 'hr/positions/create', element: <CreatePosition /> },
      { path: 'hr/positions/:id/edit', element: <EditPosition /> },
      // Employees
      { path: 'hr/employees', element: <Employees /> },
      { path: 'hr/employees/create', element: <CreateEmployee /> },
      { path: 'hr/employees/:id/edit', element: <EditEmployee /> },
      // Attendance
      { path: 'hr/attendance', element: <Attendance /> },
      // Leave Types
      { path: 'hr/leave-types', element: <LeaveTypes /> },
      { path: 'hr/leave-types/create', element: <CreateLeaveType /> },
      // Leave Requests
      { path: 'hr/leave-requests', element: <LeaveRequests /> },
      { path: 'hr/leave-requests/create', element: <CreateLeaveRequest /> },
      // Leave Balances
      { path: 'hr/leave-balances', element: <LeaveBalances /> },
      { path: 'portfolios', element: <Portfolios /> },
      { path: 'project-management', element: <ProjectManagement /> },
      { path: 'project-management/portfolios', element: <Portfolios /> },
      { path: 'project-management/resources', element: <Resources /> },
      {
        path: 'project-management/resource-requests',
        element: <ResourceRequests />,
      },
      { path: 'projects/create', element: <CreateProject /> },
      {
        path: 'portfolios/:portfolioId/projects/:projectId',
        element: <ProjectDetails />,
      },
      {
        path: 'portfolios/:portfolioId/projects/:projectId/documents',
        element: <ProjectDocuments />,
      },
      {
        path: 'portfolios/:portfolioId/projects/:projectId/tasks/:taskId',
        element: <TaskDetails />,
      },
      // Other modules
      { path: 'projects', element: <Projects /> },
      { path: 'meetings', element: <Meetings /> },
      { path: 'meetings/create', element: <CreateMeeting /> },
      { path: 'meetings/:id', element: <MeetingDetails /> },
      {
        path: 'voting',
        element: <Outlet />,
        children: [
          { index: true, element: <PollsDashboard /> },
          { path: 'create', element: <CreatePollPage /> },
          { path: ':pollId', element: <PollDetailsPage /> },
          { path: ':pollId/vote', element: <VotePage /> },
          { path: ':pollId/results', element: <ResultsPage /> },
        ],
      },
      {
        path: 'opportunities/*',
        element: <OpportunityRoutes />,
      },
      { path: 'audit-log', element: <AuditLog /> },
      { path: 'workflows', element: <Workflows /> },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <Profile /> },
      { path: 'permissions', element: <Permissions /> },
      { path: 'roles', element: <Roles /> },
      { path: 'users', element: <Users /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}