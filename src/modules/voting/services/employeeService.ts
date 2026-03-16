// Employee service for fetching HR data using existing HR service
import hrService from '../../../services/hrProjectManagementService';

export interface Employee {
  id: string;
  name: string;
  email?: string;
  departmentId?: string;
  department?: string;
  role?: string;
  jobTitle?: string;
}

export async function fetchEmployees(): Promise<Employee[]> {
  try {
    console.log('Fetching employees using HR service...');
    
    const response = await hrService.getEmployees();
    const responseData = response.data;
    
    console.log('Fetched employees from HR service:', responseData);
    
    // Handle the HR API response structure: { success: true, data: { data: [...] } }
    let employees: any[] = [];
    
    if (responseData.data) {
      // Try different possible nested structures
      employees = responseData.data.data || responseData.data.employees || responseData.data;
    } else {
      // Fallback to direct data access
      employees = responseData.employees || responseData;
    }
    
    // If still not an array, check if it's a single object with array property
    if (!Array.isArray(employees)) {
      console.log('Employees data structure:', employees);
      throw new Error(`Invalid employee data format received from HR service. Expected array, got: ${typeof employees}`);
    }
    
    console.log('Processing employees array:', employees);
    
    const processedEmployees = employees.map((emp: any) => {
      const processed = {
        id: emp.id || emp.employeeId || emp._id || '',
        name: emp.name || emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
        email: emp.email || '',
        departmentId: emp.departmentId || emp.department?.id || '',
        department: emp.department?.name || emp.departmentName || '',
        role: emp.role || emp.position || emp.jobTitle || '',
        jobTitle: emp.jobTitle || emp.position || '',
      };
      
      // Debug log for first employee to see the transformation
      if (employees.indexOf(emp) === 0) {
        console.log('Original employee data:', emp);
        console.log('Processed employee data:', processed);
      }
      
      return processed;
    });
    
    return processedEmployees;
  } catch (error) {
    console.error('Error fetching employees from HR service:', error);
    throw error;
  }
}