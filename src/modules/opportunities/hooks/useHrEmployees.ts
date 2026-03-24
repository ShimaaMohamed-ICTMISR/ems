import { useEffect, useState } from 'react';
import hrService, { type Employee } from '../../../services/hrProjectManagementService';

/**
 * Loads employees from HR API (`/api/hr/v1/employees`) using the shared hrApiClient
 * (includes X-Service-Ticket from client config — align ticket via env / hrApiClient as for other modules).
 */
export function useHrEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hrService
      .getEmployees()
      .then((res) => {
        if (cancelled) return;
        const innerData = res.data?.data;
        const list = Array.isArray(innerData?.data)
          ? innerData.data
          : Array.isArray(innerData)
            ? innerData
            : [];
        setEmployees(list);
        setLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setEmployees([]);
        setLoadError('تعذر تحميل قائمة الموظفين.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { employees, loading, loadError };
}
