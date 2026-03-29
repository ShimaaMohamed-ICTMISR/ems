import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileService, type UserProfile } from '../services/profileService';
import './Profile.css';

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function Profile() {
  // const user = useSelector((state: RootState) => state.auth.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

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
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="avatar-status"></div>
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
