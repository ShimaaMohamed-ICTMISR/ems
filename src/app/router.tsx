// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
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
} from '../pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
