// src/app/router.tsx
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import Login from '../pages/Login';
import { ProtectedRoute } from './ProtectedRoute';
import {
  Dashboard,
  Notifications,
  HumanResources,
  Projects,
  Meetings,
  AuditLog,
  Workflows,
  Settings,
  Profile,
  Permissions,
  Roles,
  Users,
} from '../pages';
import { Departments, CreateDepartment, EditDepartment } from '../pages/hr';
import { PollsDashboard } from '../modules/voting/pages/PollsDashboard';
import { PollDetailsPage } from '../modules/voting/pages/PollDetailsPage';
import { CreatePollPage } from '../modules/voting/pages/CreatePollPage';
import { VotePage } from '../modules/voting/pages/VotePage';
import { ResultsPage } from '../modules/voting/pages/ResultsPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'hr', element: <HumanResources /> },
      { path: 'hr/departments', element: <Departments /> },
      { path: 'hr/departments/create', element: <CreateDepartment /> },
      { path: 'hr/departments/:id/edit', element: <EditDepartment /> },
      { path: 'projects', element: <Projects /> },
      { path: 'meetings', element: <Meetings /> },
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
