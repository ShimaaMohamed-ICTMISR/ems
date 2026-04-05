import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { PM_ROUTE_PERMISSION_KEYS } from '../config/projectManagementPermissions';
import {
  extractPermissionCodes,
  hasPermissionInSet,
  normalizePermission,
  toUniquePermissions,
} from '../utils/permissionUtils';

export const useProjectManagementPermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const permissions = useMemo(() => {
    if (Array.isArray(user?.permissions)) {
      return toUniquePermissions(extractPermissionCodes(user.permissions));
    }

    try {
      const userFromStorage = localStorage.getItem('user');
      if (!userFromStorage) return [];
      const parsedUser = JSON.parse(userFromStorage);
      return toUniquePermissions(extractPermissionCodes(parsedUser?.permissions));
    } catch (storageError) {
      console.error('Failed to read PM user permissions from storage:', storageError);
      return [];
    }
  }, [user?.permissions]);

  const normalizedPermissions = useMemo(
    () => new Set(permissions.map((permission) => normalizePermission(permission))),
    [permissions],
  );

  const can = useCallback(
    (permission: string): boolean => hasPermissionInSet(normalizedPermissions, permission),
    [normalizedPermissions],
  );

  const canAny = useCallback(
    (permissionList: string[]): boolean => permissionList.some((permission) => can(permission)),
    [can],
  );

  const canAll = useCallback(
    (permissionList: string[]): boolean => permissionList.every((permission) => can(permission)),
    [can],
  );

  const hasAnyProjectManagementAccess = useMemo(
    () => canAny([...PM_ROUTE_PERMISSION_KEYS.HOME]),
    [canAny],
  );

  return {
    permissions,
    isLoading: false,
    isLoaded: true,
    error: null,
    can,
    canAny,
    canAll,
    hasAnyProjectManagementAccess,
  };
};

export default useProjectManagementPermissions;
