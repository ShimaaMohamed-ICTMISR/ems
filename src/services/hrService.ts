import hrApiClient from './hrApiClient';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  head: string;
  parent: string;
  costCenter: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description: string;
  head: string;
  parent?: string;
  costCenter: string;
}

// Department endpoints
export const hrService = {
  // Departments
  getDepartments: () => hrApiClient.get('/v1/departments'),
  
  getDepartmentById: (id: string) => hrApiClient.get(`/v1/departments/${id}`),
  
  createDepartment: (data: CreateDepartmentRequest) => 
    hrApiClient.post('/v1/departments', data),
  
  updateDepartment: (id: string, data: Partial<CreateDepartmentRequest>) => 
    hrApiClient.patch(`/v1/departments/${id}`, data),
  
  deleteDepartment: (id: string) => 
    hrApiClient.delete(`/v1/departments/${id}`),

  // Employees (for dropdown)
  getEmployees: () => hrApiClient.get('/v1/employees'),

  // Alternative endpoint for departments list (for parent dropdown)
  getDepartmentsList: () => hrApiClient.get('/v1/departments'),
};

export default hrService;
