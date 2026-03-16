import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DepartmentForm from './DepartmentForm';
import hrService from '../../services/hrProjectManagementService';

export function CreateDepartment() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await hrService.createDepartment(data);
      alert('Department created successfully!');
      navigate('/hr/departments');
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return <DepartmentForm onSubmit={handleSubmit} isLoading={isLoading} />;
}

export default CreateDepartment;
