// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import Login from '../pages/Login';
import { ProtectedRoute } from './ProtectedRoute';
import {
  Dashboard,
  Notifications,
  HumanResources,
  Projects,
  Meetings,
  VotingPolls,
  AuditLog,
  Workflows,
  Settings,
  Profile,
  Permissions,
  Roles,
} from '../pages';

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
      { path: 'projects', element: <Projects /> },
      { path: 'meetings', element: <Meetings /> },
      { path: 'voting-polls', element: <VotingPolls /> },
      { path: 'audit-log', element: <AuditLog /> },
      { path: 'workflows', element: <Workflows /> },
      { path: 'settings', element: <Settings /> },
      { path: 'profile', element: <Profile /> },
      { path: 'permissions', element: <Permissions /> },
      { path: 'roles', element: <Roles /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
