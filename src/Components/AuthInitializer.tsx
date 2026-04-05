import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreAuth } from "../store/authSlice";
import { authService } from "../services/authService";
import { getMeetingPermissions } from "../services/meetingService";
import hrService from "../services/hrProjectManagementService";
import {
  clearMeetingPermissions,
  fetchMeetingPermissionsFailure,
  fetchMeetingPermissionsStart,
  fetchMeetingPermissionsSuccess,
} from "../store/meetingPermissionsSlice";
import {
  clearHrPermissions,
  fetchHrPermissionsFailure,
  fetchHrPermissionsStart,
  fetchHrPermissionsSuccess,
} from "../store/hrPermissionsSlice";
import type { RootState, AppDispatch } from "../store/store";
import {
  extractPermissionCodes,
  toUniquePermissions,
} from "../utils/permissionUtils";

const toPermissionList = (payload: unknown): string[] => {
  if (Array.isArray(payload))
    return toUniquePermissions(extractPermissionCodes(payload));

  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      permissions?: unknown;
      data?: unknown;
      items?: unknown;
      sections?: unknown;
    };

    const fromPermissions = toPermissionList(typedPayload.permissions);
    if (fromPermissions.length > 0) return fromPermissions;

    const fromData = toPermissionList(typedPayload.data);
    if (fromData.length > 0) return fromData;

    const fromItems = toPermissionList(typedPayload.items);
    if (fromItems.length > 0) return fromItems;

    const fromSections = toPermissionList(typedPayload.sections);
    if (fromSections.length > 0) return fromSections;
  }

  return [];
};

const normalizeHrPermissionName = (permission: string): string =>
  permission
    .trim()
    .replace(/^HR\./i, "")
    .replace(/^HumanResources\./i, "");

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, user } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    // Restore authentication state from localStorage on app load
    const token = authService.getToken();
    const user = authService.getUser();
    dispatch(restoreAuth({ token, user }));
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      dispatch(clearMeetingPermissions());
      dispatch(clearHrPermissions());
      return;
    }

    let active = true;

    const loadMeetingPermissions = async () => {
      dispatch(fetchMeetingPermissionsStart());

      try {
        const permissions = await getMeetingPermissions();
        if (!active) return;
        dispatch(fetchMeetingPermissionsSuccess(permissions));
      } catch (error: any) {
        if (!active) return;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load meeting permissions";
        dispatch(fetchMeetingPermissionsFailure(message));
      }
    };

    const loadHrPermissions = async () => {
      dispatch(fetchHrPermissionsStart());

      const fallbackPermissions = toUniquePermissions(
        extractPermissionCodes(user?.permissions)
          .map((permission) => normalizeHrPermissionName(permission))
          .filter(Boolean),
      );

      try {
        let permissions: string[] = [];

        if (user?.id) {
          const sectionResponse = await hrService.getUserPermissionSections(
            user.id,
          );
          permissions = toPermissionList(sectionResponse.data);

          if (permissions.length === 0) {
            const positionId =
              (user as any)?.positionId || (user as any)?.position?.id;

            if (positionId) {
              const effectiveResponse =
                await hrService.getUserEffectivePermissions(
                  user.id,
                  positionId,
                );
              permissions = toPermissionList(effectiveResponse.data);
            }
          }
        }

        if (permissions.length === 0) {
          permissions = fallbackPermissions;
        }

        permissions = toUniquePermissions(
          permissions
            .map((permission) => normalizeHrPermissionName(permission))
            .filter(Boolean),
        );

        if (!active) return;
        dispatch(fetchHrPermissionsSuccess(permissions));
      } catch (error: any) {
        if (!active) return;

        if (fallbackPermissions.length > 0) {
          dispatch(fetchHrPermissionsSuccess(fallbackPermissions));
          return;
        }

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load HR permissions";

        dispatch(fetchHrPermissionsFailure(message));
      }
    };

    loadMeetingPermissions();
    loadHrPermissions();

    return () => {
      active = false;
    };
  }, [dispatch, isAuthenticated, token, user]);

  return <>{children}</>;
}
