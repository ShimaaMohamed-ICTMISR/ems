import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { VOTING_ROUTE_PERMISSION_KEYS } from "../config/votingPermissions";
import {
  extractPermissionCodes,
  hasPermissionInSet,
  normalizePermission,
  toUniquePermissions,
} from "../utils/permissionUtils";

export const useVotingPermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const permissions = useMemo(() => {
    if (Array.isArray(user?.permissions)) {
      return toUniquePermissions(extractPermissionCodes(user.permissions));
    }

    try {
      const userFromStorage = localStorage.getItem("user");
      if (!userFromStorage) return [];
      const parsedUser = JSON.parse(userFromStorage);
      return toUniquePermissions(extractPermissionCodes(parsedUser?.permissions));
    } catch (storageError) {
      console.error("Failed to read voting user permissions from storage:", storageError);
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

      // Some payloads include a redundant category prefix, e.g. voting.Voting.Options.Delete.
      if (target.startsWith("voting.")) {
        const withoutCategoryPrefix = target.replace(/^voting\./, "");
        if (hasPermissionInSet(normalizedPermissions, withoutCategoryPrefix)) {
          return true;
        }
      } else if (hasPermissionInSet(normalizedPermissions, `voting.${target}`)) {
        return true;
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

  const hasAnyVotingAccess = useMemo(
    () => canAny([...VOTING_ROUTE_PERMISSION_KEYS.HOME]),
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
    hasAnyVotingAccess,
  };
};

export default useVotingPermissions;