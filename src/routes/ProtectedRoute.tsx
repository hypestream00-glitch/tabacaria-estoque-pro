import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Carregando sessao...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
