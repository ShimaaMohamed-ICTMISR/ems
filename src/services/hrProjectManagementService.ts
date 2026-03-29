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
  gradeLevel?: string;
  salaryBandMin?: number;
  salaryBandMax?: number;
  description?: string;
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
  getDepartments: () => hrApiClient.get('/v1/departments'),
  getDepartmentById: (id: string) => hrApiClient.get(`/v1/departments?id=${id}`),
  createDepartment: (data: CreateDepartmentRequest) => hrApiClient.post('/v1/departments', data),
  updateDepartment: (id: string, data: UpdateDepartmentRequest) => hrApiClient.patch(`/v1/departments/${id}`, data),
  deleteDepartment: (id: string) => hrApiClient.delete(`/v1/departments/${id}`),
  getDepartmentsList: () => hrApiClient.get('/v1/departments'),

  // ─── Positions ───────────────────────────
  getPositions: () => hrApiClient.get('/v1/positions'),
  createPosition: (data: any) => hrApiClient.post('/v1/positions', data),
  updatePosition: (id: string, data: any) => hrApiClient.patch(`/v1/positions/${id}`, data),
  deletePosition: (id: string) => hrApiClient.delete(`/v1/positions/${id}`),

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
  cancelLeaveRequest: (id: string) => hrApiClient.delete(`/v1/leave-requests/${id}`),

  // ─── Leave Balances ──────────────────────
  getLeaveBalances: (employeeId: string, year?: number) =>
    hrApiClient.get(`/v1/leave-balances/employee/${employeeId}`, { params: year ? { year } : {} }),
};

export default hrService;
