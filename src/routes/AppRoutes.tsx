import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/layouts/AppLayout';
import { CatalogPage } from '@/pages/CatalogPage';
import { ClosingPage } from '@/pages/ClosingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { RestocksPage } from '@/pages/RestocksPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { WeeksPage } from '@/pages/WeeksPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro-auth" element={<RegisterPage />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="estoque" element={<InventoryPage />} />
        <Route path="semanas" element={<WeeksPage />} />
        <Route path="reposicao" element={<RestocksPage />} />
        <Route path="cadastro" element={<CatalogPage />} />
        <Route path="fechamento" element={<ClosingPage />} />
        <Route path="historico" element={<HistoryPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
