import { apiClient } from './apiClient';
import { taskService } from './taskService';
import { projectService } from './projectManagementServices/projectService';
import { hrService } from './hrProjectManagementService';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  roles?: string[];
  createdAt?: string;
  lastLogin?: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  averageCompletionTime: number; // in days
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  attendanceRate?: number;
  leaveBalance?: number;
}

export interface TaskStatusBreakdown {
  status: number;
  statusName: string;
  count: number;
  percentage: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export const profileService = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get<UserProfile>('/Profile');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch profile.';
      throw new Error(errorMessage);
    }
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    try {
      const response = await apiClient.put<UserProfile>('/Profile', data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update profile.';
      throw new Error(errorMessage);
    }
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/Profile/change-password', {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to change password.';
      throw new Error(errorMessage);
    }
  },

  uploadProfileImage: async (file: File): Promise<{ profileImageUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<{ profileImageUrl: string }>('/Profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to upload profile image.';
      throw new Error(errorMessage);
    }
  },

  deleteProfileImage: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.delete<{ message: string }>('/Profile/delete-image');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete profile image.';
      throw new Error(errorMessage);
    }
  },

  getUserTaskStats: async (): Promise<TaskStats> => {
    try {
      // Get current user profile first
      const profile = await profileService.getProfile();
      const currentUserId = profile.id;

      // Try to get real data from multiple sources
      const [allTasks, projects] = await Promise.all([
        taskService.getTasks().catch((error) => {
          console.warn('Could not fetch tasks:', error.message);
          return [];
        }),
        projectService.getProjects().catch((error) => {
          console.warn('Could not fetch projects:', error.message);
          return [];
        })
      ]);

      // Filter tasks for current user (if assignedToMemberId matches)
      const userTasks = allTasks.filter(task => 
        task.assignedToMemberId === currentUserId
      );

      // Calculate task statistics
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(task => task.status === 2).length; // Assuming 2 = completed
      const inProgressTasks = userTasks.filter(task => task.status === 1).length; // Assuming 1 = in progress
      const pendingTasks = userTasks.filter(task => task.status === 0).length; // Assuming 0 = pending
      
      // Calculate overdue tasks (tasks past due date and not completed)
      const now = new Date();
      const overdueTasks = userTasks.filter(task => 
        task.dueDateUtc && 
        new Date(task.dueDateUtc) < now && 
        task.status !== 2
      ).length;

      // Calculate completion percentage
      const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average completion time (simplified)
      const completedTasksWithDates = userTasks.filter(task => 
        task.status === 2 && 
        task.startDateUtc && 
        task.updatedDateUtc
      );
      
      let averageCompletionTime = 0;
      if (completedTasksWithDates.length > 0) {
        const totalDays = completedTasksWithDates.reduce((sum, task) => {
          const start = new Date(task.startDateUtc!);
          const end = new Date(task.updatedDateUtc!);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(days, 0); // Ensure positive days
        }, 0);
        averageCompletionTime = totalDays / completedTasksWithDates.length;
      }

      // Calculate project statistics (filter projects user has access to)
      // Filter projects that user is involved in (has tasks assigned)
      const userProjectIds = new Set(userTasks.map(task => task.projectId).filter(Boolean));
      const userProjects = projects.filter(project => userProjectIds.has(project.id));
      
      const totalProjects = userProjects.length;
      const activeProjects = userProjects.filter(project => 
        project.stage !== undefined && project.stage < 4 // stages 0-3 are active
      ).length;
      const completedProjects = userProjects.filter(project => 
        project.stage === 4 // stage 4 is completed
      ).length;

      // Try to get HR data if available (make this completely optional)
      let attendanceRate: number | undefined;
      let leaveBalance: number | undefined;

      // Only attempt HR calls if we have the necessary setup
      const hasHrAccess = await checkHrAccess(currentUserId);
      
      if (hasHrAccess) {
        // Get attendance stats for current month
        const currentDate = new Date();
        attendanceRate = await getAttendanceRate(currentUserId, currentDate);
        leaveBalance = await getLeaveBalance(currentUserId);
      }

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        completionPercentage,
        averageCompletionTime,
        totalProjects,
        activeProjects,
        completedProjects,
        attendanceRate,
        leaveBalance
      };

    } catch (error: any) {
      console.error('Error fetching task statistics:', error);
      // Return empty stats if everything fails
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionPercentage: 0,
        averageCompletionTime: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0
      };
    }
  },

  getUserTaskBreakdown: async (): Promise<TaskStatusBreakdown[]> => {
    try {
      // Get current user profile first
      const profile = await profileService.getProfile();
      const currentUserId = profile.id;

      const allTasks = await taskService.getTasks();
      
      // Filter tasks for current user
      const userTasks = allTasks.filter(task => 
        task.assignedToMemberId === currentUserId
      );
      
      if (userTasks.length === 0) {
        return [];
      }

      // Count tasks by status
      const statusCounts = userTasks.reduce((acc: Record<number, number>, task) => {
        const status = task.status ?? 0;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Convert to breakdown format
      const breakdown: TaskStatusBreakdown[] = [];
      const totalTasks = userTasks.length;

      // Define status names (adjust based on your system)
      const statusNames: Record<number, string> = {
        0: 'Pending',
        1: 'In Progress', 
        2: 'Completed',
        3: 'On Hold',
        4: 'Cancelled'
      };

      Object.entries(statusCounts).forEach(([status, count]) => {
        const statusNum = parseInt(status);
        const percentage = (count / totalTasks) * 100;
        
        breakdown.push({
          status: statusNum,
          statusName: statusNames[statusNum] || `Status ${statusNum}`,
          count,
          percentage
        });
      });

      return breakdown.sort((a, b) => a.status - b.status);

    } catch (error: any) {
      console.error('Error fetching task breakdown:', error);
      return [];
    }
  },
};

export default apiClient;

// Helper functions for HR data (with better error handling)
const checkHrAccess = async (userId: string): Promise<boolean> => {
  try {
    // Try a simple HR API call to check if we have access
    await hrService.getEmployeeById(userId);
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.info('HR access not available for current user (401 Unauthorized)');
    } else if (error.response?.status === 403) {
      console.info('HR access forbidden for current user (403 Forbidden)');
    } else if (error.response?.status === 404) {
      console.info('User not found in HR system (404 Not Found)');
    } else {
      console.warn('HR service check failed:', error.message);
    }
    return false;
  }
};

const getAttendanceRate = async (userId: string, currentDate: Date): Promise<number | undefined> => {
  try {
    const attendanceResponse = await hrService.getAttendanceStats(
      userId, 
      currentDate.getMonth() + 1, 
      currentDate.getFullYear()
    );
    
    if (attendanceResponse.data) {
      const data = attendanceResponse.data;
      if (data.presentDays && data.workingDays) {
        return (data.presentDays / data.workingDays) * 100;
      } else if (data.attendanceRate) {
        return data.attendanceRate;
      }
    }
    return undefined;
  } catch (error: any) {
    console.debug('Attendance data not available:', error.response?.status || error.message);
    return undefined;
  }
};

const getLeaveBalance = async (userId: string): Promise<number | undefined> => {
  try {
    const leaveResponse = await hrService.getLeaveBalances(userId);
    if (leaveResponse.data && Array.isArray(leaveResponse.data)) {
      return leaveResponse.data.reduce((total: number, balance: any) => 
        total + (balance.remainingDays || balance.balance || 0), 0
      );
    }
    return undefined;
  } catch (error: any) {
    console.debug('Leave balance data not available:', error.response?.status || error.message);
    return undefined;
  }
};
