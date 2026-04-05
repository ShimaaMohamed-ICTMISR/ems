import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
  extractPermissionCodes,
  hasPermissionInSet,
  normalizePermission,
  toUniquePermissions,
} from '../utils/permissionUtils';

export const useMeetingPermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const { isLoading, isLoaded, error } = useSelector(
    (state: RootState) => state.meetingPermissions,
  );

  const userPermissions = useMemo(() => {
    if (Array.isArray(user?.permissions)) {
      return toUniquePermissions(extractPermissionCodes(user.permissions));
    }

    try {
      const userFromStorage = localStorage.getItem('user');
      if (!userFromStorage) return [];
      const parsedUser = JSON.parse(userFromStorage);
      if (Array.isArray(parsedUser?.permissions)) {
        return toUniquePermissions(
          extractPermissionCodes(parsedUser.permissions),
        );
      }
    } catch (storageError) {
      console.error('Failed to read user permissions from storage:', storageError);
    }

    return [];
  }, [user?.permissions]);

  const effectivePermissions: string[] = Array.from(new Set(userPermissions));

  const normalizedPermissions = useMemo(
    () =>
      new Set(
        (effectivePermissions || []).map((permission: string) =>
          normalizePermission(permission),
        ),
      ),
    [effectivePermissions],
  );

  const can = useCallback(
    (permission: string): boolean => hasPermissionInSet(normalizedPermissions, permission),
    [normalizedPermissions],
  );

  const canAny = useCallback(
    (permissionList: string[]): boolean => permissionList.some((permission) => can(permission)),
    [can],
  );

  return {
    permissions: effectivePermissions,
    isLoading,
    isLoaded,
    error,
    can,
    canAny,
  };
};

export default useMeetingPermissions;
