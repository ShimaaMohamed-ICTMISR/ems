export const normalizePermission = (permission: string): string =>
  permission.trim().toLowerCase();

export const extractPermissionCode = (permission: unknown): string => {
  if (typeof permission === 'string') return permission;

  if (permission && typeof permission === 'object') {
    const typedPermission = permission as {
      code?: string;
      permissionCode?: string;
      key?: string;
      permission?: string;
      name?: string;
    };

    return (
      typedPermission.code ||
      typedPermission.permissionCode ||
      typedPermission.key ||
      typedPermission.permission ||
      typedPermission.name ||
      ''
    );
  }

  return '';
};

export const extractPermissionCodes = (permissions: unknown): string[] => {
  if (!Array.isArray(permissions)) return [];

  return permissions.flatMap((permission) => {
    if (!permission || typeof permission !== 'object') {
      const extracted = extractPermissionCode(permission);
      return extracted ? [extracted] : [];
    }

    const typedPermission = permission as {
      code?: string;
      permissionCode?: string;
      key?: string;
      permission?: string;
      name?: string;
    };

    const values = [
      typedPermission.code,
      typedPermission.permissionCode,
      typedPermission.key,
      typedPermission.permission,
      typedPermission.name,
    ].filter((value): value is string => Boolean(value));

    if (values.length > 0) return values;

    const extracted = extractPermissionCode(permission);
    return extracted ? [extracted] : [];
  });
};

export const toUniquePermissions = (permissions: string[]): string[] =>
  Array.from(new Set(permissions));

export const hasPermissionInSet = (
  normalizedPermissions: Set<string>,
  permission: string,
  options?: {
    allowWildcard?: boolean;
  },
): boolean => {
  const target = normalizePermission(permission);
  if (!target) return false;

  const allowWildcard = options?.allowWildcard ?? true;

  if (allowWildcard && normalizedPermissions.has('*')) return true;
  if (normalizedPermissions.has(target)) return true;

  if (!allowWildcard) return false;

  const [resource] = target.split('.');
  if (resource && normalizedPermissions.has(`${resource}.*`)) return true;

  return false;
};
