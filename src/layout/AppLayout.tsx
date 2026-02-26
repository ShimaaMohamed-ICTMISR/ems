// src/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileSidebarOnly, DesktopSidebarOnly } from './Sidebar';

export function AppLayout() {
  return (
    <div className="min-vh-100 p-0" style={{ background: '#f8f9fa', overflow: 'hidden' }}>
      {/* Mobile Offcanvas Sidebar */}
      <MobileSidebarOnly />

      <div className="row g-0" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Desktop Sidebar */}
        <div className="col-auto d-none d-lg-block shadow-sm" style={{ width: '280px', height: '100vh' }}>
          <DesktopSidebarOnly />
        </div>

        {/* Main Content Area */}
        <div className="col d-flex flex-column" style={{ height: '100vh', overflow: 'hidden' }}>
          <Navbar />
          <main className="flex-grow-1 overflow-auto" style={{ background: '#f8f9fa', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`main::-webkit-scrollbar { display: none; }`}</style>
            <div className="container-fluid p-4" style={{ minHeight: '100%' }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
