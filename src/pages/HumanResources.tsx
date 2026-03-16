import { useNavigate } from 'react-router-dom';

const hrModules = [
  {
    icon: 'bi-building',
    title: 'Departments',
    description: 'Manage organization departments and structure.',
    path: '/hr/departments',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: 'bi-briefcase',
    title: 'Positions',
    description: 'Manage job positions and roles.',
    path: '/hr/positions',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: 'bi-people-fill',
    title: 'Employees',
    description: 'View and manage employee profiles and records.',
    path: '/hr/employees',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    icon: 'bi-clock-history',
    title: 'Attendance',
    description: 'Track check-ins, check-outs, and attendance records.',
    path: '/hr/attendance',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    icon: 'bi-calendar2-week',
    title: 'Leave Types',
    description: 'Configure leave type policies and allowances.',
    path: '/hr/leave-types',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    icon: 'bi-envelope-paper',
    title: 'Leave Requests',
    description: 'Review, approve, and manage leave requests.',
    path: '/hr/leave-requests',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  {
    icon: 'bi-pie-chart',
    title: 'Leave Balances',
    description: 'View leave balance breakdown per employee.',
    path: '/hr/leave-balances',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
];

export function HumanResources() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', marginBottom: '.5rem' }}>
          <i className="bi bi-people me-3" style={{ color: '#667eea' }}></i>
          Human Resources
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '1rem', margin: 0 }}>
          Manage employee records, attendance, leave, and HR workflows.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}>
        {hrModules.map(mod => (
          <div
            key={mod.path}
            onClick={() => navigate(mod.path)}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,.08)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all .3s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(102,126,234,.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.08)';
            }}
          >
            <div style={{
              background: mod.gradient,
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12,
                background: 'rgba(255,255,255,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', color: 'white',
              }}>
                <i className={`bi ${mod.icon}`}></i>
              </div>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 700 }}>
                {mod.title}
              </h3>
            </div>
            <div style={{ padding: '1.2rem 1.5rem' }}>
              <p style={{ color: '#7f8c8d', fontSize: '.92rem', margin: 0 }}>{mod.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.8rem', color: '#667eea', fontSize: '.85rem', fontWeight: 600 }}>
                Open <i className="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
