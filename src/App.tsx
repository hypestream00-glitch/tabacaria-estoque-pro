import { AppRoutes } from '@/routes/AppRoutes';
import { AppProviders } from '@/providers/AppProviders';

export function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
