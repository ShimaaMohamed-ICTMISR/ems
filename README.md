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
│   └── Settings.tsx        # Settings page
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
