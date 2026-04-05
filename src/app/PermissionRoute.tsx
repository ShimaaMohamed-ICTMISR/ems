import type { ReactNode } from 'react';
import { useMeetingPermissions } from '../hooks/useMeetingPermissions';
import { useHrPermissions } from '../hooks/useHrPermissions';
import { useProjectManagementPermissions } from '../hooks/useProjectManagementPermissions';

interface PermissionRouteProps {
  children: ReactNode;
  anyOf: string[];
  scope?: 'meeting' | 'hr' | 'projectManagement';
  title?: string;
  description?: string;
}

export function PermissionRoute({
  children,
  anyOf,
  scope = 'meeting',
  title = 'Unauthorized',
  description = 'You do not have permission to access this section.',
}: PermissionRouteProps) {
  const meetingPermissions = useMeetingPermissions();
  const hrPermissions = useHrPermissions();
  const projectManagementPermissions = useProjectManagementPermissions();
  const isDev = import.meta.env.DEV;

  const activePermissions =
    scope === 'hr'
      ? hrPermissions
      : scope === 'projectManagement'
        ? projectManagementPermissions
        : meetingPermissions;
  const { canAny, isLoading, isLoaded, permissions } = activePermissions;
  const permissionChecks = anyOf.map((permission) => ({
    permission,
    granted: canAny([permission]),
  }));

  if (!isLoaded || isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '280px' }}>
        <div className="text-center">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!canAny(anyOf)) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i className="bi bi-shield-lock display-1 text-warning opacity-75"></i>
        </div>
        <h4 className="text-muted mb-2">{title}</h4>
        <p className="text-muted mb-0">{description}</p>

        {isDev && (
          <details className="text-start mt-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              Permission Debug
            </summary>
            <div className="mt-2 p-3 bg-light border rounded small">
              <p className="mb-2"><strong>Scope:</strong> {scope}</p>
              <p className="mb-1"><strong>Required (anyOf):</strong></p>
              <ul className="mb-2">
                {permissionChecks.map((item) => (
                  <li key={item.permission}>
                    {item.permission} {item.granted ? '✅' : '❌'}
                  </li>
                ))}
              </ul>
              <p className="mb-1"><strong>Effective permissions ({permissions.length}):</strong></p>
              <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(permissions, null, 2)}
              </pre>
            </div>
          </details>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
