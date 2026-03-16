import { useState } from 'react';
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
  head: z.string().optional(),
  parent: z.string().optional(),
  costCenter: z.string().min(1, 'Cost center is required'),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  initialData?: Department;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
  isLoading?: boolean;
}

// Mock data for dropdowns (fallback if API fails)
const MOCK_HEADS = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Sarah Johnson' },
  { id: '3', name: 'Mike Davis' },
  { id: '4', name: 'Emily Brown' },
  { id: '5', name: 'Robert Wilson' },
];

const MOCK_PARENT_DEPARTMENTS = [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Human Resources' },
  { id: '3', name: 'Sales' },
  { id: '4', name: 'Operations' },
  { id: '5', name: 'Finance' },
];

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
                className={`form-select ${errors.head ? 'is-invalid' : ''}`}
                {...register('head')}
              >
                <option value="">Select a head</option>
                {MOCK_HEADS.map((head) => (
                  <option key={head.id} value={head.name}>
                    {head.name}
                  </option>
                ))}
              </select>
              {errors.head && (
                <div className="invalid-feedback d-block">{errors.head.message}</div>
              )}
            </div>

            {/* Parent Department Dropdown */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <i className="bi bi-diagram-3 me-2 text-primary"></i>
                Parent Department
              </label>
              <select
                className={`form-select ${errors.parent ? 'is-invalid' : ''}`}
                {...register('parent')}
              >
                <option value="">None (Root Department)</option>
                {MOCK_PARENT_DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.parent && (
                <div className="invalid-feedback d-block">{errors.parent.message}</div>
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
              onClick={() => navigate('/hr/departments')}
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
