import hrApiClient from './hrApiClient';

// ─── Department Interfaces ───────────────────────────
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headId: string;
  parentId: string;
  costCenter: string;
}
export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
  headId?: string;
  parentId?: string;
  costCenter?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  parentId?: string;
  headId?: string;
  costCenter?: string;
  isActive?: boolean;
}

// ─── Position Interfaces ─────────────────────────────
export interface Position {
  id: string;
  title: string;
  code?: string;
  departmentId?: string;
  parentPositionId?: string;
  inheritsParentPermissions?: boolean;
  gradeLevel?: string;
  salaryBandMin?: number;
  salaryBandMax?: number;
  description?: string;
  isActive?: boolean;
  department?: any;
  subPositions?: SubPosition[];
}

export interface SubPosition {
  id: string;
  title: string;
  code?: string;
  parentPositionId?: string;
  inheritsParentPermissions?: boolean;
  salaryBandMin?: number;
  salaryBandMax?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreatePositionRequest {
  title: string;
  code: string;
  departmentId: string;
  parentPositionId?: string;
  inheritsParentPermissions?: boolean;
  description?: string;
  salaryBandMin?: number;
  salaryBandMax?: number;
}

export interface UpdatePositionRequest {
  title?: string;
  description?: string;
  departmentId?: string;
  parentPositionId?: string;
  salaryBandMin?: number;
  salaryBandMax?: number;
  isActive?: boolean;
  inheritsParentPermissions?: boolean;
}

export interface CreateSubPositionRequest {
  title: string;
  code: string;
  inheritsParentPermissions?: boolean;
  description?: string;
  salaryBandMin?: number;
  salaryBandMax?: number;
}

export interface UpdateSubPositionRequest {
  title?: string;
  description?: string;
  salaryBandMin?: number;
  salaryBandMax?: number;
  isActive?: boolean;
  inheritsParentPermissions?: boolean;
}

export interface AssignPositionPermissionRequest {
  permissionCode: string;
}

export interface PositionPermission {
  permissionCode: string;
  source?: string;
}

// ─── Permission Interfaces (HR Service) ─────────────
export interface AssignUserPermissionRequest {
  permissionCode: string;
}

// ─── Employee Interfaces ─────────────────────────────
export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  departmentId: string;
  positionId: string;
  hireDate: string;
  terminationDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  emergencyContact?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  department?: any;
  position?: any;
  manager?: any;
}

export interface CreateEmployeeRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  departmentId: string;
  positionId: string;
  hireDate: string;
  status?: string;
  emergencyContact?: string;
}

export interface UpdateEmployeeRequest {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  departmentId?: string;
  positionId?: string;
  hireDate?: string;
  status?: string;
  emergencyContact?: string;
  terminationDate?: string;
}

// ─── Leave Type Interfaces ───────────────────────────
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  daysAllowed: number;
  requiresApproval: boolean;
  isPaid: boolean;
  carryForward?: boolean;
  maxCarryForward?: number;
  isActive: boolean;
}

export interface CreateLeaveTypeRequest {
  name: string;
  code: string;
  description?: string;
  daysAllowed: number;
  requiresApproval: boolean;
  isPaid?: boolean;
  carryForward?: boolean;
  maxCarryForward?: number;
  isActive?: boolean;
}

// ─── Leave Request Interfaces ────────────────────────
export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED';
  reason?: string;
  approverComments?: string;
  emergencyContact?: string;
  documents?: string;
  createdAt: string;
  updatedAt: string;
  employee?: any;
  leaveType?: any;
  approvers?: any[];
}

export interface CreateLeaveRequestRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  emergencyContact?: string;
  documents?: string;
}

export interface UpdateLeaveRequestRequest {
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: string;
  approverComments?: string;
}

export interface UpdateLeaveRequestStatusRequest {
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'IN_PROGRESS'
    | 'COMPLETED';
  approverComments?: string;
}

// ─── Attendance Interfaces ───────────────────────────
export interface AttendancePolicy {
  id: string;
  name: string;
  description?: string;
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
  overtimeAllowed: boolean;
  flexibleHours: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  status?: string;
}

// ─── Service ─────────────────────────────────────────
export const hrService = {
  // ─── Departments ─────────────────────────
  getDepartments: (params?: { id?: string; isActive?: boolean }) =>
    hrApiClient.get('/v1/departments', { params }),
  getDepartmentById: (id: string) => hrApiClient.get(`/v1/departments?id=${id}`),
  createDepartment: (data: CreateDepartmentRequest) => hrApiClient.post('/v1/departments', data),
  updateDepartment: (id: string, data: UpdateDepartmentRequest) => hrApiClient.patch(`/v1/departments/${id}`, data),
  deleteDepartment: (id: string) => hrApiClient.delete(`/v1/departments/${id}`),
  getDepartmentsList: () => hrApiClient.get('/v1/departments'),

  // ─── Positions ───────────────────────────
  getPositions: (params?: { id?: string; departmentId?: string; parentPositionId?: string; isActive?: boolean }) =>
    hrApiClient.get('/v1/positions', { params }),
  getPositionById: (id: string) => hrApiClient.get('/v1/positions', { params: { id } }),
  createPosition: (data: CreatePositionRequest) => hrApiClient.post('/v1/positions', data),
  updatePosition: (id: string, data: UpdatePositionRequest) => hrApiClient.patch(`/v1/positions/${id}`, data),
  deletePosition: (id: string) => hrApiClient.delete(`/v1/positions/${id}`),

  // ─── Sub-Positions (Mini-Positions) ────────
  getSubPositions: (positionId: string, params?: { isActive?: boolean }) =>
    hrApiClient.get(`/v1/positions/${positionId}/sub-positions`, { params }),
  getSubPosition: (positionId: string, subPositionId: string) =>
    hrApiClient.get(`/v1/positions/${positionId}/sub-positions/${subPositionId}`),
  createSubPosition: (positionId: string, data: CreateSubPositionRequest) =>
    hrApiClient.post(`/v1/positions/${positionId}/sub-positions`, data),
  updateSubPosition: (positionId: string, subPositionId: string, data: UpdateSubPositionRequest) =>
    hrApiClient.patch(`/v1/positions/${positionId}/sub-positions/${subPositionId}`, data),
  deleteSubPosition: (positionId: string, subPositionId: string) =>
    hrApiClient.delete(`/v1/positions/${positionId}/sub-positions/${subPositionId}`),

  // ─── Position Permissions ─────────────────
  getPositionPermissions: (positionId: string) =>
    hrApiClient.get(`/v1/positions/${positionId}/permissions`),
  assignPositionPermission: (positionId: string, data: AssignPositionPermissionRequest) =>
    hrApiClient.post(`/v1/positions/${positionId}/permissions`, data),
  removePositionPermission: (positionId: string, permissionCode: string) =>
    hrApiClient.delete(`/v1/positions/${positionId}/permissions/${permissionCode}`),

  // ─── HR Permissions ───────────────────────
  getHrPermissions: () => hrApiClient.get('/v1/permissions'),
  assignUserPermission: (userId: string, data: AssignUserPermissionRequest) =>
    hrApiClient.post(`/v1/permissions/users/${userId}`, data),
  removeUserPermission: (userId: string, permissionCode: string) =>
    hrApiClient.delete(`/v1/permissions/users/${userId}/${permissionCode}`),
  getUserEffectivePermissions: (userId: string, positionId: string) =>
    hrApiClient.get(`/v1/permissions/users/${userId}/effective`, { params: { positionId } }),
  getUserPermissionSections: (userId: string) =>
    hrApiClient.get(`/v1/permissions/users/${userId}/sections`),

  // ─── Employees ───────────────────────────
  getEmployees: (params?: { page?: number; limit?: number; departmentId?: string; positionId?: string; status?: string }) =>
    hrApiClient.get('/v1/employees', { params }),
  getEmployeeById: (id: string) => hrApiClient.get(`/v1/employees?id=${id}`),
  createEmployee: (data: CreateEmployeeRequest) => hrApiClient.post('/v1/employees', data),
  updateEmployee: (id: string, data: UpdateEmployeeRequest) => hrApiClient.patch(`/v1/employees/${id}`, data),
  deleteEmployee: (id: string) => hrApiClient.delete(`/v1/employees/${id}`),
  getSubordinates: (id: string) => hrApiClient.get(`/v1/employees/${id}/subordinates`),
  getHierarchy: (id: string) => hrApiClient.get(`/v1/employees/${id}/hierarchy`),

  // ─── Attendance ──────────────────────────
  getAttendancePolicies: () => hrApiClient.get('/v1/attendance/policies'),
  createAttendancePolicy: (data: { name: string; description?: string; workingHoursPerDay: number; workingDaysPerWeek: number; overtimeAllowed: boolean; flexibleHours: boolean }) =>
    hrApiClient.post('/v1/attendance/policies', data),
  checkIn: (data: { employeeId: string; checkInTime: string }) => hrApiClient.post('/v1/attendance/check-in', data),
  checkOut: (data: { employeeId: string; checkOutTime: string }) => hrApiClient.post('/v1/attendance/check-out', data),
  markAbsence: (data: { employeeId: string; date: string; reason?: string }) => hrApiClient.post('/v1/attendance/absence', data),
  getEmployeeAttendance: (employeeId: string, params?: { startDate?: string; endDate?: string }) =>
    hrApiClient.get(`/v1/attendance/employee/${employeeId}`, { params }),
  getAttendanceStats: (employeeId: string, month: number, year: number) =>
    hrApiClient.get(`/v1/attendance/employee/${employeeId}/stats`, { params: { month, year } }),

  // ─── Leave Types ─────────────────────────
  getLeaveTypes: () => hrApiClient.get('/v1/leave-types'),
  createLeaveType: (data: CreateLeaveTypeRequest) => hrApiClient.post('/v1/leave-types', data),

  // ─── Leave Requests ──────────────────────
  getLeaveRequests: (params?: { id?: string; employeeId?: string; status?: string; leaveTypeId?: string; startDate?: string; endDate?: string }) =>
    hrApiClient.get('/v1/leave-requests', { params }),
  createLeaveRequest: (data: CreateLeaveRequestRequest) => hrApiClient.post('/v1/leave-requests', data),
  updateLeaveRequest: (id: string, data: UpdateLeaveRequestRequest) => hrApiClient.patch(`/v1/leave-requests/${id}`, data),
  updateLeaveRequestStatus: (id: string, data: UpdateLeaveRequestStatusRequest) =>
    hrApiClient.patch(`/v1/leave-requests/${id}/status`, data),
  cancelLeaveRequest: (id: string) => hrApiClient.delete(`/v1/leave-requests/${id}`),

  // ─── Leave Balances ──────────────────────
  getLeaveBalances: (employeeId: string, year?: number) =>
    hrApiClient.get(`/v1/leave-balances/employee/${employeeId}`, { params: year ? { year } : {} }),
};

export default hrService;
