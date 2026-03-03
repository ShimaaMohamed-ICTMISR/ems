import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { restoreAuth } from '../store/authSlice';
import { authService } from '../services/authService';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore authentication state from localStorage on app load
    const token = authService.getToken();
    const user = authService.getUser();
    dispatch(restoreAuth({ token, user }));
  }, [dispatch]);

  return <>{children}</>;
}
