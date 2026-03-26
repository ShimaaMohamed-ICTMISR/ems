// Employee service for fetching HR data
import axios from 'axios';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  departmentId?: string;
  department?: string;
  role?: string;
  jobTitle?: string;
}

const HR_EMPLOYEES_URL =
  'https://ems-human-resources-management-service.onrender.com/api/hr/v1/employees';
const HR_SERVICE_TICKET = 'auH2RtYi9df5vO79WXl5XyaUck6GNwClJ54ayehPU9A=';

export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const response = await axios.get(HR_EMPLOYEES_URL, {
      headers: {
        'X-Service-Ticket': HR_SERVICE_TICKET,
      },
    });
    const responseData = response.data;

    // Handle common HR API response structures
    let employees: any[] = [];

    if (responseData.data) {
      employees = responseData.data.data || responseData.data.employees || responseData.data;
    } else {
      employees = responseData.employees || responseData;
    }

    if (!Array.isArray(employees)) {
      throw new Error(`Invalid employee data format received from HR service. Expected array, got: ${typeof employees}`);
    }

    const processedEmployees = employees.map((emp: any) => {
      return {
        id: emp.id || emp.employeeId || emp._id || '',
        name: emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
        email: emp.email || '',
        departmentId: emp.departmentId || emp.department?.id || '',
        department: emp.department?.name || emp.departmentName || '',
        role: emp.role || emp.position || emp.jobTitle || '',
        jobTitle: emp.jobTitle || emp.position || '',
      };
    });

    return processedEmployees;
  } catch (error) {
    console.error('Error fetching employees from HR service:', error);
    throw error;
  }
}