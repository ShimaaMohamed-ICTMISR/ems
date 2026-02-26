// src/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: '/', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/notifications', icon: 'bi-bell', label: 'Notifications' },
];

const moduleNavItems: NavItem[] = [
  { to: '/hr', icon: 'bi-people', label: 'Human Resources' },
  { to: '/projects', icon: 'bi-kanban', label: 'Projects' },
  { to: '/meetings', icon: 'bi-calendar-event', label: 'Meetings' },
  { to: '/voting-polls', icon: 'bi-bar-chart', label: 'Voting & Polls' },
];

const systemNavItems: NavItem[] = [
  { to: '/audit-log', icon: 'bi-journal-text', label: 'Audit Log' },
  { to: '/workflows', icon: 'bi-diagram-3', label: 'Workflows' },
  { to: '/settings', icon: 'bi-gear', label: 'Settings' },
];

function NavItems({ items }: { items: NavItem[] }) {
  const handleClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      const offcanvasElement = document.getElementById('appSidebar');
      if (offcanvasElement) {
        const bsOffcanvas = (window as any).bootstrap?.Offcanvas?.getInstance(offcanvasElement);
        if (bsOffcanvas) {
          bsOffcanvas.hide();
        }
      }
    }
  };

  return (
    <>
      {items.map((item) => (
        <li key={item.to} className="nav-item">
          <NavLink
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `nav-link text-white d-flex align-items-center gap-3 px-3 py-2 rounded ${
                isActive ? 'fw-semibold shadow-sm' : 'hover-bg-white-10'
              }`
            }
            onClick={handleClick}
            style={({ isActive }) => ({
              transition: 'all 0.2s ease',
              backgroundColor: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #06b6d4' : '3px solid transparent'
            })}
          >
            <i className={`bi ${item.icon} fs-5`}></i>
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </>
  );
}

function SidebarContent() {
  return (
    <div className="d-flex flex-column" style={{ backgroundColor: '#0f172a', minHeight: '100vh', height: '100%' }}>
      {/* Logo/Brand */}
      <div className="p-4 border-bottom border-secondary">
        <h2 className="text-white mb-0 fw-bold">
          <i className="bi bi-stack me-2 fs-3" style={{ color: '#06b6d4' }}></i>
          EMS
        </h2>
        <small className="text-white-50">Management System</small>
      </div>

      {/* Navigation */}
      <nav className="overflow-auto p-3" style={{ flex: '1 1 auto', minHeight: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
        {/* MAIN Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">Main</h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={mainNavItems} />
          </ul>
        </div>

        {/* MODULES Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">Modules</h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={moduleNavItems} />
          </ul>
        </div>

        {/* SYSTEM Section */}
        <div className="mb-4">
          <h6 className="text-uppercase text-white-50 small mb-3 px-2 fw-bold">System</h6>
          <ul className="nav flex-column gap-1">
            <NavItems items={systemNavItems} />
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-top border-secondary mt-auto">
        <div className="d-flex align-items-center text-white">
          <div className="rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px', backgroundColor: '#06b6d4' }}>
            <i className="bi bi-person-fill text-white fs-5"></i>
          </div>
          <div>
            <div className="fw-semibold">Shimaa Mohamed</div>
            <small className="text-white-50">admin@Finovate.com</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <div className="d-lg-block text-white shadow-sm d-flex flex-column" style={{ backgroundColor: '#0f172a', height: '100vh' }}>
      <SidebarContent />
    </div>
  );
}

function MobileSidebar() {
  return (
    <div
      className="offcanvas offcanvas-start text-white d-lg-none"
      tabIndex={-1}
      id="appSidebar"
      aria-labelledby="appSidebarLabel"
      style={{ backgroundColor: '#0f172a' }}
    >
      <div className="offcanvas-header border-bottom border-secondary">
        <button
          type="button"
          className="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        ></button>
      </div>
      <div className="offcanvas-body p-0 d-flex flex-column">
        <SidebarContent />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Offcanvas Sidebar */}
      <MobileSidebar />
    </>
  );
}

export function DesktopSidebarOnly() {
  return <DesktopSidebar />;
}

export function MobileSidebarOnly() {
  return <MobileSidebar />;
}
