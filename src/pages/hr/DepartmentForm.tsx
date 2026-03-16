import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Department } from '../../services/hrProjectManagementService';
import '../styles/DepartmentForm.css';

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  description: z.string().optional(),
  headId: z.string().optional(),
  parentId: z.string().optional(),
  costCenter: z.string().min(1, 'Cost center is required'),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  initialData?: Department;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  isLoading?: boolean;
}


export function DepartmentForm({ initialData, onSubmit, isLoading = false }: DepartmentFormProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: initialData || {},
  });

  // Update form when initialData changes (e.g., when editing an existing department)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmitForm = async (data: DepartmentFormData) => {
    try {
      setError(null);
      await onSubmit(data);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="department-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>{initialData ? 'Edit Department' : 'Create New Department'}</h2>
          <p className="form-subtitle">
            {initialData ? 'Update department information' : 'Add a new department to your organization'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className="row g-4">
            {/* Name Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-building me-2 text-primary"></i>
                Department Name *
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g., Engineering"
                {...register('name')}
              />
              {errors.name && (
                <div className="invalid-feedback d-block">{errors.name.message}</div>
              )}
            </div>

            {/* Code Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-barcode me-2 text-primary"></i>
                Department Code *
              </label>
              <input
                type="text"
                className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                placeholder="e.g., ENG-001"
                {...register('code')}
              />
              {errors.code && (
                <div className="invalid-feedback d-block">{errors.code.message}</div>
              )}
            </div>

            {/* Cost Center Field */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-cash-stack me-2 text-primary"></i>
                Cost Center *
              </label>
              <input
                type="text"
                className={`form-control ${errors.costCenter ? 'is-invalid' : ''}`}
                placeholder="e.g., CC-001"
                {...register('costCenter')}
              />
              {errors.costCenter && (
                <div className="invalid-feedback d-block">{errors.costCenter.message}</div>
              )}
            </div>

            {/* Department Head Dropdown */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-person-badge me-2 text-primary"></i>
                Department Head
              </label>
              <select
                className={`form-select ${errors.headId ? 'is-invalid' : ''}`}
                {...register('headId')}
              >
                <option value="">Select a head</option>
              </select>
              {errors.headId && (
                <div className="invalid-feedback d-block">{errors.headId.message}</div>
              )}
            </div>

            {/* Parent Department Dropdown */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-diagram-3 me-2 text-primary"></i>
                Parent Department
              </label>
              <select
                className={`form-select ${errors.parentId ? 'is-invalid' : ''}`}
                {...register('parentId')}
              >
                <option value="">None (Root Department)</option>
              </select>
              {errors.parentId && (
                <div className="invalid-feedback d-block">{errors.parentId.message}</div>
              )}
            </div>

            {/* Description Field */}
            <div className="col-12">
              <label className="form-label fw-semibold">
                <i className="bi bi-chat-left-text me-2 text-primary"></i>
                Description
              </label>
              <textarea
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                placeholder="Enter department description..."
                rows={4}
                {...register('description')}
              ></textarea>
              {errors.description && (
                <div className="invalid-feedback d-block">{errors.description.message}</div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions mt-5">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/dashboard/hr/departments')}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {initialData ? 'Update' : 'Create'} Department
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DepartmentForm;
