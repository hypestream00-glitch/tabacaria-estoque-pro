import { Boxes, ClipboardCheck, Cog, FileClock, LayoutDashboard, ListChecks, LogOut, PackageSearch, PlusSquare, X } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/estoque', label: 'Estoque', icon: Boxes },
  { to: '/semanas', label: 'Semanas', icon: ListChecks },
  { to: '/reposicao', label: 'Reposicao', icon: PackageSearch },
  { to: '/cadastro', label: 'Cadastro', icon: PlusSquare },
  { to: '/fechamento', label: 'Fechamento', icon: ClipboardCheck },
  { to: '/historico', label: 'Historico', icon: FileClock },
  { to: '/configuracoes', label: 'Configuracoes', icon: Cog }
];

export function AppLayout() {
  const { signOut } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-800/80 bg-slate-950/70 p-4 lg:block">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Tabacaria Pro</h2>
          <p className="text-sm text-muted-foreground">Controle inteligente de estoque</p>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800',
                    isActive && 'bg-sky-600/30 text-sky-100'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <Button className="mt-8 w-full" variant="outline" onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </aside>

      <main className="p-4 md:p-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 px-2 py-1 lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {items.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn('flex flex-col items-center rounded-md px-2 py-2 text-[11px]', active ? 'text-sky-300' : 'text-slate-400')}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <button className="sr-only" aria-label="sem funcionalidade">
        <X />
      </button>
    </div>
  );
}
