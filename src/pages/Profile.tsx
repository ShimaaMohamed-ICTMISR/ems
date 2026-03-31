import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { profileService, type UserProfile, type TaskStats, type TaskStatusBreakdown } from '../services/profileService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './Profile.css';

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function Profile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [taskBreakdown, setTaskBreakdown] = useState<TaskStatusBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
    },
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await profileService.getProfile();
        setProfile(data);
        reset({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
        });
      } catch (error: any) {
        setApiError(error.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTaskStats = async () => {
      try {
        const [stats, breakdown] = await Promise.all([
          profileService.getUserTaskStats(),
          profileService.getUserTaskBreakdown()
        ]);
        setTaskStats(stats);
        setTaskBreakdown(breakdown);
      } catch (error: any) {
        console.error('Failed to load task statistics:', error);
        // Don't show error for task stats, just log it
      }
    };

    fetchProfile();
    fetchTaskStats();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setApiError('');
      setSuccessMessage('');
      const updated = await profileService.updateProfile(data);
      setProfile(updated);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setApiError(error.message || 'Failed to update profile');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setApiError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setApiError('Image size must be less than 5MB.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setApiError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload image
      const response = await profileService.uploadProfileImage(file);
      
      // Update profile with new image URL
      setProfile(prev => prev ? { ...prev, profileImageUrl: response.profileImageUrl } : null);
      setSuccessMessage('Profile image updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setApiError(error.message || 'Failed to upload image');
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      setApiError('');
      await profileService.deleteProfileImage();
      setProfile(prev => prev ? { ...prev, profileImageUrl: undefined } : null);
      setImagePreview(null);
      setSuccessMessage('Profile image deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setApiError(error.message || 'Failed to delete image');
    }
  };

  // Helper function to get status colors for charts
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return '#64748b'; // Pending - Gray
      case 1: return '#f59e0b'; // In Progress - Orange  
      case 2: return '#10b981'; // Completed - Green
      case 3: return '#ef4444'; // Overdue - Red
      default: return '#06b6d4'; // Default - Primary
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-wrapper">
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="profile-title">
                <i className="bi bi-person-circle me-3"></i>
                My Profile
              </h1>
              <p className="profile-subtitle">Manage your personal information and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="row g-4">
          {/* Left Side - Profile Card */}
          <div className="col-lg-4">
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {imagePreview || profile?.profileImageUrl ? (
                      <img 
                        src={imagePreview || profile?.profileImageUrl} 
                        alt="Profile" 
                        className="avatar-image"
                      />
                    ) : (
                      <i className="bi bi-person-fill"></i>
                    )}
                    {isUploadingImage && (
                      <div className="avatar-loading">
                        <div className="spinner-border spinner-border-sm text-white"></div>
                      </div>
                    )}
                  </div>
                  {user?.isActive !== undefined && (
                    <div className={`avatar-status ${user.isActive ? 'active' : 'inactive'}`}></div>
                  )}
                  
                  {/* Image Upload Controls */}
                  <div className="avatar-controls">
                    <input
                      type="file"
                      id="profileImageInput"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="d-none"
                      disabled={isUploadingImage}
                    />
                    <button
                      type="button"
                      className="avatar-upload-btn"
                      onClick={() => document.getElementById('profileImageInput')?.click()}
                      disabled={isUploadingImage}
                      title="Upload new image"
                    >
                      <i className="bi bi-camera"></i>
                    </button>
                    {(profile?.profileImageUrl || imagePreview) && (
                      <button
                        type="button"
                        className="avatar-delete-btn"
                        onClick={handleDeleteImage}
                        disabled={isUploadingImage}
                        title="Remove image"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="profile-info">
                  <h3 className="profile-name">
                    {profile?.firstName && profile?.lastName
                      ? `${profile.firstName} ${profile.lastName}`
                      : profile?.username}
                  </h3>
                  <p className="profile-email">{profile?.email}</p>
                </div>
              </div>

              <div className="profile-card-body">
                <div className="profile-stats">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="bi bi-person-badge"></i>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Username</span>
                      <span className="stat-value">{profile?.username}</span>
                    </div>
                  </div>

                  {profile?.roles && profile.roles.length > 0 && (
                    <div className="profile-roles-inline">
                      <span className="profile-roles-label">Roles:</span>
                      <div className="profile-roles-container-inline">
                        {profile.roles.map((role: any) => (
                          <span key={role.id || role} className="profile-role-badge-small">
                            {role.name || role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Statistics Card */}
            {taskStats && (
              <div className="profile-card mt-4">
                <div className="profile-card-header">
                  <div className="profile-info">
                    <h4 className="profile-name">
                      <i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--primary-color)' }}></i>
                      Task Statistics
                    </h4>
                    <p className="profile-email">Completion Rate: {taskStats.completionPercentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="profile-card-body">
                  <div className="task-stats-grid">
                    <div className="task-stat-item">
                      <div className="task-stat-icon total">
                        <i className="bi bi-list-task"></i>
                      </div>
                      <div className="task-stat-content">
                        <span className="task-stat-number">{taskStats.totalTasks}</span>
                        <span className="task-stat-label">Total Tasks</span>
                      </div>
                    </div>
                    
                    <div className="task-stat-item">
                      <div className="task-stat-icon completed">
                        <i className="bi bi-check-circle-fill"></i>
                      </div>
                      <div className="task-stat-content">
                        <span className="task-stat-number">{taskStats.completedTasks}</span>
                        <span className="task-stat-label">Completed</span>
                      </div>
                    </div>
                    
                    <div className="task-stat-item">
                      <div className="task-stat-icon progress">
                        <i className="bi bi-clock-fill"></i>
                      </div>
                      <div className="task-stat-content">
                        <span className="task-stat-number">{taskStats.inProgressTasks}</span>
                        <span className="task-stat-label">In Progress</span>
                      </div>
                    </div>
                    
                    <div className="task-stat-item">
                      <div className="task-stat-icon overdue">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                      </div>
                      <div className="task-stat-content">
                        <span className="task-stat-number">{taskStats.overdueTasks}</span>
                        <span className="task-stat-label">Overdue</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats Row */}
                  <div className="task-stats-grid">
                    <div className="task-stat-item">
                      <div className="task-stat-icon total" style={{ background: '#8b5cf6' }}>
                        <i className="bi bi-folder-fill"></i>
                      </div>
                      <div className="task-stat-content">
                        <span className="task-stat-number">{taskStats.totalProjects}</span>
                        <span className="task-stat-label">Total Projects</span>
                      </div>
                    </div>
                    
                    <div className="task-stat-item">
                      <div className="task-stat-icon progress" style={{ background: '#06b6d4' }}>
                        <i className="bi bi-play-circle-fill"></i>
                      </div>
                      <div className="task-stat-content">
                        <span className="task-stat-number">{taskStats.activeProjects}</span>
                        <span className="task-stat-label">Active Projects</span>
                      </div>
                    </div>
                    
                    {taskStats.attendanceRate !== undefined && (
                      <div className="task-stat-item">
                        <div className="task-stat-icon completed" style={{ background: '#10b981' }}>
                          <i className="bi bi-calendar-check-fill"></i>
                        </div>
                        <div className="task-stat-content">
                          <span className="task-stat-number">{taskStats.attendanceRate.toFixed(1)}%</span>
                          <span className="task-stat-label">Attendance</span>
                        </div>
                      </div>
                    )}
                    
                    {taskStats.leaveBalance !== undefined && (
                      <div className="task-stat-item">
                        <div className="task-stat-icon" style={{ background: '#f59e0b' }}>
                          <i className="bi bi-calendar-x-fill"></i>
                        </div>
                        <div className="task-stat-content">
                          <span className="task-stat-number">{taskStats.leaveBalance}</span>
                          <span className="task-stat-label">Leave Days</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="completion-progress">
                    <div className="progress-header">
                      <span>Overall Completion Rate</span>
                      <span className="progress-percentage">{taskStats.completionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${taskStats.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Profile Form and Charts */}
          <div className="col-lg-8">
            <div className="profile-form-card">
              <div className="form-card-header">
                <div className="header-content">
                  <h4 className="form-title">
                    <i className="bi bi-gear me-2"></i>
                    Profile Settings
                  </h4>
                  <p className="form-subtitle">Update your personal information</p>
                </div>
                <button
                  type="button"
                  className={`edit-toggle-btn ${isEditing ? 'editing' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <i className={`bi bi-${isEditing ? 'x-lg' : 'pencil-square'}`}></i>
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="form-card-body">
                {/* Success Message */}
                {successMessage && (
                  <div className="alert alert-success custom-alert" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {successMessage}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSuccessMessage('')}
                    ></button>
                  </div>
                )}

                {/* Error Message */}
                {apiError && (
                  <div className="alert alert-danger custom-alert" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {apiError}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setApiError('')}
                    ></button>
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="firstName" className="form-label">
                            <i className="bi bi-person me-2"></i>
                            First Name
                          </label>
                          <input
                            id="firstName"
                            type="text"
                            className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                            placeholder="Enter your first name"
                            {...register('firstName')}
                          />
                          {errors.firstName && (
                            <div className="invalid-feedback">{errors.firstName.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="lastName" className="form-label">
                            <i className="bi bi-person me-2"></i>
                            Last Name
                          </label>
                          <input
                            id="lastName"
                            type="text"
                            className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                            placeholder="Enter your last name"
                            {...register('lastName')}
                          />
                          {errors.lastName && (
                            <div className="invalid-feedback">{errors.lastName.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="phoneNumber" className="form-label">
                            <i className="bi bi-telephone me-2"></i>
                            Phone Number
                          </label>
                          <input
                            id="phoneNumber"
                            type="tel"
                            className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                            placeholder="Enter your phone number"
                            {...register('phoneNumber')}
                          />
                          {errors.phoneNumber && (
                            <div className="invalid-feedback">{errors.phoneNumber.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">
                            <i className="bi bi-envelope me-2"></i>
                            Email Address
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={profile?.email || ''}
                            disabled
                            style={{ backgroundColor: '#f8f9fa' }}
                          />
                          <small className="text-muted">Email cannot be changed</small>
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary save-btn"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-display">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="info-item">
                          <div className="info-icon">
                            <i className="bi bi-person"></i>
                          </div>
                          <div className="info-content">
                            <label>First Name</label>
                            <p>{profile?.firstName || 'Not set'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <div className="info-icon">
                            <i className="bi bi-person"></i>
                          </div>
                          <div className="info-content">
                            <label>Last Name</label>
                            <p>{profile?.lastName || 'Not set'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <div className="info-icon">
                            <i className="bi bi-telephone"></i>
                          </div>
                          <div className="info-content">
                            <label>Phone Number</label>
                            <p>{profile?.phoneNumber || 'Not set'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <div className="info-icon">
                            <i className="bi bi-envelope"></i>
                          </div>
                          <div className="info-content">
                            <label>Email Address</label>
                            <p>{profile?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Task Charts - Always show */}
            <div className="profile-form-card mt-4">
              <div className="form-card-header">
                <div className="header-content">
                  <h4 className="form-title">
                    <i className="bi bi-pie-chart me-2"></i>
                    Task Analysis
                  </h4>
                  <p className="form-subtitle">Task distribution by status</p>
                </div>
              </div>
              <div className="form-card-body">
                {taskStats && taskBreakdown.length > 0 ? (
                  <div className="row g-4">
                    {/* Pie Chart */}
                    <div className="col-md-6">
                      <div className="chart-container">
                        <h5 className="chart-title">Task Distribution</h5>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={taskBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="count"
                            >
                              {taskBreakdown.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={getStatusColor(entry.status)} 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, _name, props) => [
                                `${value} tasks (${props.payload?.percentage?.toFixed(1) || 0}%)`,
                                props.payload?.statusName || 'Unknown'
                              ]}
                            />
                            <Legend 
                              formatter={(_value, entry) => (entry.payload as any)?.statusName || 'Unknown'}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="col-md-6">
                      <div className="chart-container">
                        <h5 className="chart-title">Detailed Statistics</h5>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={taskBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="statusName" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, _name) => [`${value} tasks`, 'Count']}
                              labelFormatter={(label) => `Status: ${label}`}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="var(--primary-color)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-tasks-message">
                    <div className="text-center py-5">
                      <i className="bi bi-bar-chart display-1 text-muted mb-3"></i>
                      <h5 className="text-muted">No Task Data Available</h5>
                      <p className="text-muted">
                        {!taskStats 
                          ? "Loading task data..."
                          : taskStats.totalTasks === 0 
                            ? "You don't have any assigned tasks yet. Charts will appear once you have tasks with different statuses."
                            : "All your tasks have the same status. Charts will show more detail as you progress through different task statuses."
                        }
                      </p>
                      {/* Debug info */}
                      <small className="text-muted">
                        Debug: taskStats={taskStats ? 'loaded' : 'null'}, 
                        breakdown length={taskBreakdown.length}, 
                        total tasks={taskStats?.totalTasks || 0}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
