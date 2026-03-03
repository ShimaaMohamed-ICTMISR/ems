import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { authService } from '../services/authService';
import finovatelogo from '../assets/images/finovate-logo.webp';

export function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authService.logout();
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still dispatch logout to clear local state even if API fails
      dispatch(logout());
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark  shadow-sm" style={{ backgroundColor: '#0f172a' }}>
      <div className="container-fluid px-4">
        {/* Hamburger for mobile */}
        <button
          className="btn btn-link text-white d-lg-none me-2 p-0"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#appSidebar"
          aria-controls="appSidebar"
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-3"></i>
        </button>

        {/* Page Title */}
        <span className="navbar-brand mb-0 fw-bold d-flex align-items-center" style={{ fontSize: '1.5rem', minHeight: '50px' }}>
          {/* <i className="bi bi-building fs-4 me-2" style={{ color: '#06b6d4' }}></i> */}
         <img 
           src={finovatelogo} 
           alt="Finovate Logo"
           className="img-fluid"
           style={{ 
             maxWidth: '100%',
             height: 'auto', //maintains aspects ratio
             maxHeight: '50px',
             objectFit: 'contain'
           }}
        />
        </span> 

        {/* Search and Actions */}
        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="d-none d-md-block">
            <div className="position-relative">
              <i className="bi bi-search position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, fontSize: '0.9rem' }}></i>
              <input
                type="search"
                className="form-control border-0 shadow-sm ps-5"
                placeholder="Search anything..."
                aria-label="Search"
                style={{ 
                  width: '320px',
                  borderRadius: '25px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '0.875rem',
                  paddingTop: '0.6rem',
                  paddingBottom: '0.6rem',
                  paddingRight: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.width = '380px';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.width = '320px';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.boxShadow = '';
                }}
              />
            </div>
          </div>
          <button
            className="btn btn-link text-white position-relative p-0 icon-bounce"
            type="button"
            aria-label="Notifications"
          >
            <i className="bi bi-bell fs-5"></i>
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" style={{ backgroundColor: '#cd0606' }}>
              3
              <span className="visually-hidden">unread notifications</span>
            </span>
          </button>
          <div className="dropdown">
            <button className="btn btn-link text-white p-0 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="bi bi-person-circle fs-4"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
              <li className="px-3 py-2 text-muted small">
                <div>{user?.username || user?.email || 'User'}</div>
              </li>
              <li><hr className="dropdown-divider m-0 my-2" /></li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => navigate('/profile')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  <i className="bi bi-person me-2" style={{ color: '#06b6d4' }}></i>Profile
                </button>
              </li>
              <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2 text-secondary"></i>Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button
                  className="dropdown-item text-danger border-0 bg-transparent w-100 text-start"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer', opacity: isLoggingOut ? 0.7 : 1 }}
                >
                  {isLoggingOut ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </>
                  )}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
