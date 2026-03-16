// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import { Departments, CreateDepartment, EditDepartment } from "../pages/hr";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
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
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
