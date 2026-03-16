import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DepartmentForm from './DepartmentForm';
import hrService from '../../services/hrService';

export function CreateDepartment() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const payload: any = {
        name: data.name,
        code: data.code,
        costCenter: data.costCenter,
      };
      if (data.description) payload.description = data.description;
      if (data.head) payload.headId = data.head;
      if (data.parent) payload.parentId = data.parent;

      await hrService.createDepartment(payload);
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
