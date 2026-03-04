import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DepartmentForm from './DepartmentForm';
import type { Department } from '../../services/hrService';
import hrService from '../../services/hrService';

export function EditDepartment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      if (id) {
        const response = await hrService.getDepartmentById(id);
        setDepartment(response.data.data || response.data);
      }
    } catch (err) {
      console.error('Error fetching department:', err);
      setError('Failed to load department');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      if (id) {
        await hrService.updateDepartment(id, data);
      }
      alert('Department updated successfully!');
      navigate('/hr/departments');
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4">
        {error}
      </div>
    );
  }

  if (!department) {
    return (
      <div className="alert alert-danger m-4">
        Department not found
      </div>
    );
  }

  return <DepartmentForm initialData={department} onSubmit={handleSubmit} isLoading={isLoading} />;
}

export default EditDepartment;
