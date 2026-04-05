import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { FEATURE_PERMISSIONS } from '../config/permissions';
import type { FeaturePermissionType, PermissionType } from '../config/permissions';
import {
  extractPermissionCodes,
  hasPermissionInSet,
  normalizePermission,
  toUniquePermissions,
} from '../utils/permissionUtils';

/**
 * Get user permissions from localStorage
 * Reads from the 'user' object under 'permissions' array
 */
export const getUserPermissionsFromStorage = (): string[] => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];

    const user = JSON.parse(userStr);
    return toUniquePermissions(extractPermissionCodes(user?.permissions));
  } catch (error) {
    console.error('Error reading permissions from storage:', error);
    return [];
  }
};

/**
 * Hook to check user permissions
 * Checks both Redux store and localStorage
 */
export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  // Get permissions from Redux or localStorage
  const permissions = useMemo(() => {
    // Priority: Redux store permissions, fallback to localStorage
    if (user?.permissions && Array.isArray(user.permissions)) {
      return toUniquePermissions(extractPermissionCodes(user.permissions));
    }
    return getUserPermissionsFromStorage();
  }, [user?.permissions]);

  const normalizedPermissions = useMemo(
    () => new Set(permissions.map((permission) => normalizePermission(permission))),
    [permissions],
  );

  /**
   * Check if user has a specific permission
   * @param permission - The permission string to check
   * @returns true if user has the permission, false otherwise
   */
  const hasPermission = useCallback(
    (permission: PermissionType | string): boolean => {
      return hasPermissionInSet(normalizedPermissions, permission);
    },
    [normalizedPermissions]
  );

  /**
   * Check if user has a specific feature permission
   * @param feature - The feature key from FEATURE_PERMISSIONS
   * @returns true if user has the feature permission, false otherwise
   */
  const hasFeaturePermission = useCallback(
    (feature: FeaturePermissionType): boolean => {
      const permission = FEATURE_PERMISSIONS[feature];
      return hasPermission(permission);
    },
    [hasPermission]
  );

  /**
   * Check if user has any of the specified permissions
   * @param permissionList - Array of permission strings
   * @returns true if user has at least one permission, false otherwise
   */
  const hasAnyPermission = useCallback(
    (permissionList: (PermissionType | string)[]): boolean => {
      if (!Array.isArray(permissionList)) return false;
      return permissionList.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  /**
   * Check if user has all of the specified permissions
   * @param permissionList - Array of permission strings
   * @returns true if user has all permissions, false otherwise
   */
  const hasAllPermissions = useCallback(
    (permissionList: (PermissionType | string)[]): boolean => {
      if (!Array.isArray(permissionList)) return false;
      return permissionList.every((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  return {
    permissions,
    hasPermission,
    hasFeaturePermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default usePermissions;
