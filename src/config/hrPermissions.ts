export const HR_PERMISSION_KEYS = {
  DEPARTMENTS: {
    VIEW: ['Departments.View'],
    CREATE: ['Departments.Create'],
    EDIT: ['Departments.Edit'],
    DELETE: ['Departments.Delete'],
  },
  POSITIONS: {
    VIEW: ['Positions.View'],
    CREATE: ['Positions.Create'],
    EDIT: ['Positions.Edit'],
    DELETE: ['Positions.Delete'],
  },
  EMPLOYEES: {
    VIEW: ['Employees.View'],
    CREATE: ['Employees.Create'],
    EDIT: ['Employees.Edit'],
    DELETE: ['Employees.Delete'],
    SUBORDINATES_VIEW: ['Employees.Subordinates.View'],
  },
  ATTENDANCE: {
    VIEW: ['Attendance.View'],
    CREATE: ['Attendance.Create'],
  },
  LEAVE_TYPES: {
    VIEW: ['LeaveTypes.View'],
    CREATE: ['LeaveTypes.Create'],
  },
  LEAVE_REQUESTS: {
    VIEW: ['LeaveRequests.View'],
    CREATE: ['LeaveRequests.Create'],
    EDIT: ['LeaveRequests.Edit'],
    DELETE: ['LeaveRequests.Delete'],
  },
  LEAVE_BALANCES: {
    VIEW: ['LeaveBalances.View'],
    CREATE: ['LeaveBalances.Create'],
  },
  COMPENSATION: {
    VIEW: ['Compensation.View'],
    CREATE: ['Compensation.Create'],
    EDIT: ['Compensation.Edit'],
    HISTORY_VIEW: ['Compensation.History.View'],
    HISTORY_CREATE: ['Compensation.History.Create'],
  },
  LIFECYCLE: {
    VIEW: ['Lifecycle.View'],
    CREATE: ['Lifecycle.Create'],
    EDIT: ['Lifecycle.Edit'],
    DOCUMENTS_VIEW: ['Lifecycle.Documents.View'],
    DOCUMENTS_CREATE: ['Lifecycle.Documents.Create'],
  },
  PERFORMANCE_CYCLES: {
    VIEW: ['PerformanceCycles.View'],
    CREATE: ['PerformanceCycles.Create'],
    EDIT: ['PerformanceCycles.Edit'],
  },
  PERFORMANCE_REVIEWS: {
    VIEW: ['PerformanceReviews.View'],
    CREATE: ['PerformanceReviews.Create'],
    EDIT: ['PerformanceReviews.Edit'],
    HISTORY_VIEW: ['PerformanceReviews.History.View'],
  },
  SKILLS: {
    VIEW: ['Skills.View'],
    CREATE: ['Skills.Create'],
    EDIT: ['Skills.Edit'],
    CATEGORIES_VIEW: ['Skills.Categories.View'],
    CATEGORIES_CREATE: ['Skills.Categories.Create'],
  },
} as const;

const unique = (permissionKeys: string[]): string[] =>
  Array.from(new Set(permissionKeys));

const flattenPermissionKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.values(value as Record<string, unknown>).flatMap(flattenPermissionKeys);
};

export const HR_ROUTE_PERMISSION_KEYS = {
  HR_HOME: unique(flattenPermissionKeys(HR_PERMISSION_KEYS)),
  DEPARTMENTS: unique([
    ...HR_PERMISSION_KEYS.DEPARTMENTS.VIEW,
    ...HR_PERMISSION_KEYS.DEPARTMENTS.CREATE,
    ...HR_PERMISSION_KEYS.DEPARTMENTS.EDIT,
    ...HR_PERMISSION_KEYS.DEPARTMENTS.DELETE,
  ]),
  POSITIONS: unique([
    ...HR_PERMISSION_KEYS.POSITIONS.VIEW,
    ...HR_PERMISSION_KEYS.POSITIONS.CREATE,
    ...HR_PERMISSION_KEYS.POSITIONS.EDIT,
    ...HR_PERMISSION_KEYS.POSITIONS.DELETE,
  ]),
  EMPLOYEES: unique([
    ...HR_PERMISSION_KEYS.EMPLOYEES.VIEW,
    ...HR_PERMISSION_KEYS.EMPLOYEES.CREATE,
    ...HR_PERMISSION_KEYS.EMPLOYEES.EDIT,
    ...HR_PERMISSION_KEYS.EMPLOYEES.DELETE,
  ]),
  ATTENDANCE: unique([
    ...HR_PERMISSION_KEYS.ATTENDANCE.VIEW,
    ...HR_PERMISSION_KEYS.ATTENDANCE.CREATE,
  ]),
  LEAVE_TYPES: unique([
    ...HR_PERMISSION_KEYS.LEAVE_TYPES.VIEW,
    ...HR_PERMISSION_KEYS.LEAVE_TYPES.CREATE,
  ]),
  LEAVE_REQUESTS: unique([
    ...HR_PERMISSION_KEYS.LEAVE_REQUESTS.VIEW,
    ...HR_PERMISSION_KEYS.LEAVE_REQUESTS.CREATE,
    ...HR_PERMISSION_KEYS.LEAVE_REQUESTS.EDIT,
    ...HR_PERMISSION_KEYS.LEAVE_REQUESTS.DELETE,
  ]),
  LEAVE_BALANCES: unique([
    ...HR_PERMISSION_KEYS.LEAVE_BALANCES.VIEW,
    ...HR_PERMISSION_KEYS.LEAVE_BALANCES.CREATE,
  ]),
} as const;
