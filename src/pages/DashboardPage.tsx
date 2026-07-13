import { AlertTriangle, Boxes, DollarSign, PiggyBank, ShoppingCart, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentMonth, useDashboard } from '@/hooks/useInventory';
import { formatMoney } from '@/utils/format';

export function DashboardPage() {
  const monthQuery = useCurrentMonth();
  const dashboardQuery = useDashboard(monthQuery.data?.id);

  const metrics = dashboardQuery.data ?? {
    products_count: 0,
    total_stock_qty: 0,
    total_invested: 0,
    total_potential_revenue: 0,
    month_revenue: 0,
    gross_profit: 0,
    commission_value: 0,
    net_profit: 0,
    low_stock_count: 0,
    by_week: [] as Array<{ name: string; receita: number; lucro: number }>
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Visao geral automatica do estoque e desempenho mensal" />

      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Produtos" value={String(metrics.products_count)} icon={Boxes} />
            <StatCard title="Estoque total" value={String(metrics.total_stock_qty)} icon={ShoppingCart} />
            <StatCard title="Valor investido" value={formatMoney(Number(metrics.total_invested))} icon={PiggyBank} />
            <StatCard title="Potencial de venda" value={formatMoney(Number(metrics.total_potential_revenue))} icon={TrendingUp} />
            <StatCard title="Receita do mes" value={formatMoney(Number(metrics.month_revenue))} icon={DollarSign} />
            <StatCard title="Lucro bruto" value={formatMoney(Number(metrics.gross_profit))} icon={TrendingUp} />
            <StatCard title="Comissao" value={formatMoney(Number(metrics.commission_value))} icon={DollarSign} />
            <StatCard title="Produtos em baixa" value={String(metrics.low_stock_count)} icon={AlertTriangle} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por semana</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.by_week}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2b3b" />
                    <XAxis dataKey="name" stroke="#93a4b7" />
                    <YAxis stroke="#93a4b7" />
                    <Tooltip />
                    <Bar dataKey="receita" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lucro por semana</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.by_week}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2b3b" />
                    <XAxis dataKey="name" stroke="#93a4b7" />
                    <YAxis stroke="#93a4b7" />
                    <Tooltip />
                    <Bar dataKey="lucro" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
