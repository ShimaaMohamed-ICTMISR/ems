import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { profileService, type UserProfile } from '../services/profileService';
import { taskService, type Task } from '../services/taskService';
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
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loadingMyTasks, setLoadingMyTasks] = useState(false);
  const [showMyTaskAnalytics, setShowMyTaskAnalytics] = useState(false);
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

    fetchProfile();
  }, [reset]);

  // Fetch user's project-management tasks (directly via assignedMemberId) for more accurate profile analytics.
  useEffect(() => {
    const userId = user?.id || profile?.id;
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingMyTasks(true);
        const tasks = await taskService.getTasks({ assignedMemberId: userId });
        if (!cancelled) setMyTasks(Array.isArray(tasks) ? tasks : []);
      } catch (e) {
        // Keep profile usable even if project management is unavailable.
        if (!cancelled) setMyTasks([]);
      } finally {
        if (!cancelled) setLoadingMyTasks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.id]);

  const taskStatusLabel = (status: number | undefined): string => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Overdue';
      default: return status == null ? 'Unknown' : `Status ${status}`;
    }
  };

  const statusBadgeClass = (status: number | undefined): string => {
    switch (status) {
      case 2: return 'bg-success';
      case 1: return 'bg-warning text-dark';
      case 3: return 'bg-danger';
      case 0: return 'bg-secondary';
      default: return 'bg-info';
    }
  };

  const now = new Date();
  const overdueCount = myTasks.filter((t) => t.dueDateUtc && new Date(t.dueDateUtc) < now && t.status !== 2).length;
  const dueSoonCount = myTasks.filter((t) => {
    if (!t.dueDateUtc || t.status === 2) return false;
    const due = new Date(t.dueDateUtc);
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }).length;
  const inProgressCount = myTasks.filter((t) => t.status === 1).length;
  const pendingCount = myTasks.filter((t) => t.status === 0).length;
  const completedCount = myTasks.filter((t) => t.status === 2).length;
  const completionRate = myTasks.length > 0 ? (completedCount / myTasks.length) * 100 : 0;

  const myTaskStatusChartData = (() => {
    const counts = myTasks.reduce((acc: Record<string, number>, t) => {
      const label = taskStatusLabel(t.status);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const myTaskDueChartData = (() => {
    const hasDue = (t: Task) => Boolean(t.dueDateUtc);
    const due = (t: Task) => (t.dueDateUtc ? new Date(t.dueDateUtc) : null);
    const overdue = myTasks.filter((t) => hasDue(t) && due(t)!.getTime() < now.getTime() && t.status !== 2).length;
    const dueSoon = myTasks.filter((t) => {
      if (!hasDue(t) || t.status === 2) return false;
      const d = due(t)!;
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
    const dueLater = myTasks.filter((t) => {
      if (!hasDue(t) || t.status === 2) return false;
      const d = due(t)!;
      const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 7;
    }).length;
    const noDue = myTasks.filter((t) => !hasDue(t) && t.status !== 2).length;
    const completed = completedCount;
    return [
      { name: 'Overdue', value: overdue },
      { name: 'Due in 7 days', value: dueSoon },
      { name: 'Due later', value: dueLater },
      { name: 'No due date', value: noDue },
      { name: 'Completed', value: completed },
    ].filter((x) => x.value > 0);
  })();

  const myTaskStatusChartDataForRender =
    !loadingMyTasks && myTaskStatusChartData.length === 0 ? [{ name: 'No tasks yet', value: 1 }] : myTaskStatusChartData;

  const myTaskDueChartDataForRender =
    !loadingMyTasks && myTaskDueChartData.length === 0 ? [{ name: 'No tasks yet', value: 1 }] : myTaskDueChartData;

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

            {/* My Tasks (Project Management) - direct user analytics */}
            <div className="profile-card mt-4">
              <div className="profile-card-header">
                <div className="profile-info">
                  <h4 className="profile-name">
                    <i className="bi bi-kanban-fill me-2" style={{ color: 'var(--primary-color)' }}></i>
                    My Tasks (Project Management)
                  </h4>
                  <p className="profile-email">
                    {loadingMyTasks ? 'Loading…' : `${myTasks.length} task(s)`}
                  </p>
                </div>
                <div className="mytasks-header-actions">
                  <button
                    type="button"
                    className={`mytasks-tab ${!showMyTaskAnalytics ? 'active' : ''}`}
                    onClick={() => setShowMyTaskAnalytics(false)}
                  >
                    <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                    Overview
                  </button>
                  <button
                    type="button"
                    className={`mytasks-tab ${showMyTaskAnalytics ? 'active' : ''}`}
                    onClick={() => setShowMyTaskAnalytics(true)}
                  >
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    Analytics
                  </button>
                </div>
              </div>
              <div className="profile-card-body">
                <div className="task-stats-grid">
                  <div className="task-stat-item">
                    <div className="task-stat-icon total" style={{ background: '#06b6d4' }}>
                      <i className="bi bi-list-task"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{myTasks.length}</span>
                      <span className="task-stat-label">Total</span>
                    </div>
                  </div>
                  <div className="task-stat-item">
                    <div className="task-stat-icon completed">
                      <i className="bi bi-check-circle-fill"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{completedCount}</span>
                      <span className="task-stat-label">Completed</span>
                    </div>
                  </div>
                  <div className="task-stat-item">
                    <div className="task-stat-icon progress">
                      <i className="bi bi-clock-fill"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{inProgressCount}</span>
                      <span className="task-stat-label">In Progress</span>
                    </div>
                  </div>
                  <div className="task-stat-item">
                    <div className="task-stat-icon overdue">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{overdueCount}</span>
                      <span className="task-stat-label">Overdue</span>
                    </div>
                  </div>
                </div>

                <div className="task-stats-grid">
                  <div className="task-stat-item">
                    <div className="task-stat-icon total" style={{ background: '#64748b' }}>
                      <i className="bi bi-hourglass-split"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{pendingCount}</span>
                      <span className="task-stat-label">Pending</span>
                    </div>
                  </div>
                  <div className="task-stat-item">
                    <div className="task-stat-icon progress" style={{ background: '#f59e0b' }}>
                      <i className="bi bi-calendar-event-fill"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{dueSoonCount}</span>
                      <span className="task-stat-label">Due in 7 days</span>
                    </div>
                  </div>
                  <div className="task-stat-item">
                    <div className="task-stat-icon completed" style={{ background: '#10b981' }}>
                      <i className="bi bi-graph-up-arrow"></i>
                    </div>
                    <div className="task-stat-content">
                      <span className="task-stat-number">{completionRate.toFixed(1)}%</span>
                      <span className="task-stat-label">Completion</span>
                    </div>
                  </div>
                </div>

                <div className={`analytics-panel ${showMyTaskAnalytics ? 'open' : ''}`}>
                  <div className="analytics-panel-inner">
                    {/* Charts */}
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="chart-container chart-card">
                          <div className="chart-header">
                            <div className="chart-title">
                              <i className="bi bi-pie-chart-fill me-2"></i>
                              Task status
                            </div>
                            <div className="chart-subtitle">Distribution across your current tasks</div>
                          </div>
                          {loadingMyTasks ? (
                            <div className="text-muted small">Loading…</div>
                          ) : (
                            <ResponsiveContainer width="100%" height={220}>
                              <PieChart>
                                <Pie
                                  data={myTaskStatusChartDataForRender}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={85}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {myTaskStatusChartDataForRender.map((entry, index) => (
                                    <Cell
                                      key={`my-status-${index}`}
                                      fill={
                                        entry.name === 'No tasks yet'
                                          ? '#cbd5e1'
                                          : getStatusColor(
                                              entry.name === 'Completed'
                                                ? 2
                                                : entry.name === 'In Progress'
                                                  ? 1
                                                  : entry.name === 'Overdue'
                                                    ? 3
                                                    : 0
                                            )
                                      }
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value: any, _name: any, props: any) =>
                                    props?.payload?.name === 'No tasks yet' ? ['No tasks yet', ''] : [`${value} tasks`, 'Count']
                                  }
                                />
                                {myTaskStatusChartData.length > 0 && <Legend />}
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                      <div className="col-12 col-lg-6">
                        <div className="chart-container chart-card">
                          <div className="chart-header">
                            <div className="chart-title">
                              <i className="bi bi-bar-chart-fill me-2"></i>
                              Due buckets
                            </div>
                            <div className="chart-subtitle">Overdue vs upcoming vs completed</div>
                          </div>
                          {loadingMyTasks ? (
                            <div className="text-muted small">Loading…</div>
                          ) : myTaskDueChartData.length === 0 ? (
                            <div className="text-muted small">No tasks yet.</div>
                          ) : (
                            <ResponsiveContainer width="100%" height={240}>
                              <BarChart data={myTaskDueChartDataForRender}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={55} />
                                <YAxis allowDecimals={false} />
                                <Tooltip formatter={(value: any) => [`${value} tasks`, 'Count']} />
                                <Bar dataKey="value" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="recent-tasks-card mt-3">
                      {loadingMyTasks ? (
                        <small className="text-muted">Loading tasks…</small>
                      ) : myTasks.length === 0 ? (
                        <small className="text-muted">No tasks assigned to you yet.</small>
                      ) : (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted fw-semibold">Recent tasks</small>
                          </div>
                          {myTasks
                            .slice()
                            .sort((a, b) => {
                              const ad = a.updatedDateUtc || a.createdDateUtc || '';
                              const bd = b.updatedDateUtc || b.createdDateUtc || '';
                              return bd.localeCompare(ad);
                            })
                            .slice(0, 5)
                            .map((t) => (
                              <div key={t.id} className="recent-task-row">
                                <div className="me-2" style={{ minWidth: 0 }}>
                                  <div className="fw-medium text-truncate">{t.title || t.description || t.id}</div>
                                  <small className="text-muted">
                                    {t.dueDateUtc ? `Due: ${new Date(t.dueDateUtc).toLocaleDateString()}` : 'No due date'}
                                  </small>
                                </div>
                                <span className={`badge ${statusBadgeClass(t.status)} ms-2`}>
                                  {taskStatusLabel(t.status)}
                                </span>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Profile Form */}
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

          </div>
        </div>
      </div>
    </div>
  );
}
