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
  Users,
} from '../pages';
import {
  Departments, CreateDepartment, EditDepartment,
  Positions, CreatePosition, EditPosition,
  Employees, CreateEmployee, EditEmployee,
  Attendance,
  LeaveTypes, CreateLeaveType,
  LeaveRequests, CreateLeaveRequest,
  LeaveBalances,
} from '../pages/hr';

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
      // Other modules
      { path: 'projects', element: <Projects /> },
      { path: 'meetings', element: <Meetings /> },
      { path: 'voting-polls', element: <VotingPolls /> },
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
