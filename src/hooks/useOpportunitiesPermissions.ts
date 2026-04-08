import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { OPPORTUNITY_ROUTE_PERMISSION_KEYS } from '../config/opportunitiesPermissions';
import {
  extractPermissionCodes,
  hasPermissionInSet,
  normalizePermission,
  toUniquePermissions,
} from '../utils/permissionUtils';

export const useOpportunitiesPermissions = () => {
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
      console.error('Failed to read opportunities user permissions from storage:', storageError);
      return [];
    }
  }, [user?.permissions]);

  const normalizedPermissions = useMemo(
    () => new Set(permissions.map((permission) => normalizePermission(permission))),
    [permissions],
  );

  const can = useCallback(
    (permission: string): boolean => {
      const target = normalizePermission(permission);
      if (!target) return false;

      if (hasPermissionInSet(normalizedPermissions, target)) {
        return true;
      }

      const withOrWithoutModulePrefix = target.startsWith('opportunitymanagement.')
        ? target.replace(/^opportunitymanagement\./, '')
        : `opportunitymanagement.${target}`;
      if (hasPermissionInSet(normalizedPermissions, withOrWithoutModulePrefix)) {
        return true;
      }

      if (target.startsWith('opportunities.')) {
        if (
          hasPermissionInSet(
            normalizedPermissions,
            target.replace(/^opportunities\./, 'opportunity.'),
          )
        ) {
          return true;
        }
      } else if (target.startsWith('opportunity.')) {
        if (
          hasPermissionInSet(
            normalizedPermissions,
            target.replace(/^opportunity\./, 'opportunities.'),
          )
        ) {
          return true;
        }
      }

      if (target.startsWith('leads.')) {
        if (hasPermissionInSet(normalizedPermissions, target.replace(/^leads\./, 'lead.'))) {
          return true;
        }
      } else if (target.startsWith('lead.')) {
        if (hasPermissionInSet(normalizedPermissions, target.replace(/^lead\./, 'leads.'))) {
          return true;
        }
      }

      if (target.startsWith('quotes.')) {
        if (hasPermissionInSet(normalizedPermissions, target.replace(/^quotes\./, 'quote.'))) {
          return true;
        }
      } else if (target.startsWith('quote.')) {
        if (hasPermissionInSet(normalizedPermissions, target.replace(/^quote\./, 'quotes.'))) {
          return true;
        }
      }

      return false;
    },
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

  const hasAnyOpportunitiesAccess = useMemo(
    () => canAny([...OPPORTUNITY_ROUTE_PERMISSION_KEYS.HOME]),
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
    hasAnyOpportunitiesAccess,
  };
};

export default useOpportunitiesPermissions;
