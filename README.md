# Enterprise Management System (EMS)

A production-ready, fully responsive React + TypeScript + Vite application with Bootstrap 5.

## Features

- **Persistent Layout**: Fixed Navbar (top) and Sidebar (left) with routed content area
- **Fully Responsive**: Desktop sidebar becomes offcanvas on mobile
- **Bootstrap 5**: Complete styling with Bootstrap CSS and components
- **React Router v6**: Nested routing with clean URL structure
- **TypeScript**: Strict type safety throughout
- **Production Ready**: Optimized build with Vite

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router DOM v6+
- Bootstrap 5
- Bootstrap Icons

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── app/
│   └── router.tsx          # React Router configuration
├── layout/
│   ├── AppLayout.tsx       # Main layout wrapper
│   ├── Navbar.tsx          # Top navigation bar
│   └── Sidebar.tsx         # Left sidebar (desktop) / Offcanvas (mobile)
├── pages/
│   ├── Dashboard.tsx       # Dashboard page
│   ├── Notifications.tsx   # Notifications page
│   ├── HumanResources.tsx  # HR management page
│   ├── Projects.tsx        # Projects page
│   ├── Meetings.tsx        # Meetings page
│   ├── VotingPolls.tsx     # Voting & Polls page
│   ├── AuditLog.tsx        # Audit log page
│   ├── Workflows.tsx       # Workflows page
│   ├── Settings.tsx        # Settings page
│   ├── Profile.tsx         # User profile page
│   ├── Permissions.tsx     # Permissions management
│   ├── Roles.tsx           # Roles management
│   └── Users.tsx           # User management page
├── services/
│   ├── apiClient.ts        # Axios API client configuration
│   ├── authService.ts      # Authentication service
│   ├── permissionService.ts # Permissions API service
│   ├── roleService.ts      # Roles API service
│   └── userService.ts      # Users API service
├── main.tsx                # Application entry point
└── index.css               # Global styles
```

## Routes

- `/` - Dashboard
- `/notifications` - Notifications
- `/hr` - Human Resources
- `/projects` - Projects
- `/meetings` - Meetings
- `/voting-polls` - Voting & Polls
- `/audit-log` - Audit Log
- `/workflows` - Workflows
- `/settings` - Settings
- `/profile` - User Profile
- `/permissions` - Permissions Management
- `/roles` - Roles Management
- `/users` - User Management

## API Integration

The application integrates with the IAM Auth API at `http://iamauth.runasp.net/api`

### User Management Features

The Users page (`/users`) provides comprehensive user management:

- **List Users**: Paginated user list with search and filtering
- **Create User**: Add new users with username, email, name, password, and phone
- **Update User**: Edit user details (first name, last name, phone)
- **Delete User**: Remove users from the system
- **Reactivate User**: Restore inactive users
- **Toggle MFA**: Enable/disable multi-factor authentication
- **Role Management**: Assign and remove roles with optional expiration dates
- **Session Management**: View and revoke active user sessions

### API Endpoints Used

- `GET /api/User` - List users with pagination and filters
- `POST /api/User` - Create new user
- `GET /api/User/{id}` - Get user details
- `PUT /api/User/{id}` - Update user
- `DELETE /api/User/{id}` - Delete user
- `POST /api/User/{id}/reactivate` - Reactivate user
- `POST /api/User/{id}/toggle-mfa` - Toggle MFA
- `POST /api/User/{id}/roles` - Assign role to user
- `DELETE /api/User/{id}/roles/{roleId}` - Remove role from user
- `GET /api/User/{id}/sessions` - Get user sessions
- `POST /api/User/sessions/{sessionId}/revoke` - Revoke session

## Responsive Behavior

### Desktop (>= lg breakpoint)
- Sidebar is visible as a fixed left column (280px width)
- Navbar is sticky at the top
- Content area scrolls independently

### Mobile/Tablet (< lg breakpoint)
- Sidebar becomes Bootstrap Offcanvas (slides in from left)
- Hamburger button in navbar toggles the offcanvas
- Clicking a nav item automatically closes the offcanvas

## Key Features

- **Keyboard Navigation**: Full keyboard accessibility support
- **ARIA Labels**: Proper accessibility attributes throughout
- **No Inline Styles**: Uses Bootstrap utility classes
- **TypeScript Strict**: No `any` types, full type safety
- **Bootstrap Components**: Offcanvas, Navbar, Cards, Tables, Forms, Badges, etc.

## Customization

All Bootstrap variables can be customized by importing Bootstrap SCSS instead of CSS and overriding variables before the import.

## License

MIT
