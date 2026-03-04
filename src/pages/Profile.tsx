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
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="row">
        {/* Left Side - Profile Info */}
        <div className="col-md-4">
          <div className="card profile-card shadow-sm">
            <div className="card-body text-center">
              <div className="profile-avatar mb-3">
                <i className="bi bi-person-circle" style={{ fontSize: '60px', color: '#06b6d4' }}></i>
              </div>
              <h5 className="card-title fw-bold">
                {profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile?.username}
              </h5>
              <p className="text-muted small">{profile?.email}</p>
              <hr />
              <div className="profile-meta small">
                <div className="mb-2">
                  <span className="text-muted">Username:</span>
                  <p className="fw-bold">{profile?.username}</p>
                </div>
                {profile?.roles && profile.roles.length > 0 && (
                  <div className="mb-2">
                    <span className="text-muted">Roles:</span>
                    <div className="mt-1">
                      {profile.roles.map((role: any) => (
                        <span key={role.id || role} className="badge bg-primary me-1">
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

        {/* Right Side - Edit Profile */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">Profile Information</h5>
              <button
                type="button"
                className={`btn btn-sm ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setIsEditing(!isEditing)}
              >
                <i className={`bi bi-${isEditing ? 'x' : 'pencil'} me-1`}></i>
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="card-body">
              {/* Success Message */}
              {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
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
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-circle me-2"></i>
                  {apiError}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setApiError('')}
                  ></button>
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      placeholder="Enter first name"
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback d-block">{errors.firstName.message}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      placeholder="Enter last name"
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback d-block">{errors.lastName.message}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                      placeholder="Enter phone number"
                      {...register('phoneNumber')}
                    />
                    {errors.phoneNumber && (
                      <div className="invalid-feedback d-block">{errors.phoneNumber.message}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="profile-display">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="text-muted small">First Name</label>
                      <p className="fw-bold">{profile?.firstName || 'Not set'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small">Last Name</label>
                      <p className="fw-bold">{profile?.lastName || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="text-muted small">Phone Number</label>
                      <p className="fw-bold">{profile?.phoneNumber || 'Not set'}</p>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small">Email</label>
                      <p className="fw-bold">{profile?.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
