import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
  extractPermissionCodes,
  hasPermissionInSet,
  normalizePermission,
  toUniquePermissions,
} from '../utils/permissionUtils';

export const useHrPermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    permissions: hrPermissions,
    isLoading,
    isLoaded,
    error,
  } = useSelector((state: RootState) => state.hrPermissions);

  const fallbackUserPermissions = useMemo(() => {
    if (Array.isArray(user?.permissions)) {
      return toUniquePermissions(extractPermissionCodes(user.permissions));
    }

    try {
      const userFromStorage = localStorage.getItem('user');
      if (!userFromStorage) return [];
      const parsedUser = JSON.parse(userFromStorage);
      return toUniquePermissions(extractPermissionCodes(parsedUser?.permissions));
    } catch (storageError) {
      console.error('Failed to read HR user permissions from storage:', storageError);
      return [];
    }
  }, [user?.permissions]);

  const userPermissions = useMemo(() => {
    if (isLoaded) {
      return toUniquePermissions(extractPermissionCodes(hrPermissions));
    }

    return fallbackUserPermissions;
  }, [isLoaded, hrPermissions, fallbackUserPermissions]);

  const normalizedPermissions = useMemo(
    () =>
      new Set(
        userPermissions.flatMap((permission) => {
          const normalized = normalizePermission(permission);
          const withoutHrPrefix = normalized.replace(/^hr\./i, '');
          const withoutHumanResourcesPrefix = normalized.replace(/^humanresources\./i, '');

          return [normalized, withoutHrPrefix, withoutHumanResourcesPrefix];
        }),
      ),
    [userPermissions],
  );

  const can = useCallback(
    (permission: string): boolean =>
      hasPermissionInSet(normalizedPermissions, permission, { allowWildcard: false }),
    [normalizedPermissions],
  );

  const canAny = useCallback(
    (permissionList: string[]): boolean => permissionList.some((permission) => can(permission)),
    [can],
  );

  return {
    permissions: userPermissions,
    servicePermissions: hrPermissions,
    isLoading,
    isLoaded,
    error,
    can,
    canAny,
  };
};

export default useHrPermissions;
