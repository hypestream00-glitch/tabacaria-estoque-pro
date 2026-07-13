import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentMonth, useInventoryMutations, useWeekItems, useWeeks } from '@/hooks/useInventory';
import { formatMoney } from '@/utils/format';

export function ClosingPage() {
  const monthQuery = useCurrentMonth();
  const weeksQuery = useWeeks(monthQuery.data?.id);
  const [confirm, setConfirm] = useState(false);
  const mutations = useInventoryMutations();

  const firstWeekId = weeksQuery.data?.[0]?.id;
  const weekItems = useWeekItems(firstWeekId);

  const totals = useMemo(() => {
    return (weekItems.data ?? []).reduce(
      (acc, item) => {
        acc.sold += item.sold_qty;
        acc.revenue += item.revenue;
        acc.cost += item.cost_amount;
        acc.profit += item.gross_profit;
        return acc;
      },
      { sold: 0, revenue: 0, cost: 0, profit: 0 }
    );
  }, [weekItems.data]);

  const commission = totals.revenue * 0.3;
  const net = totals.revenue - totals.cost - commission;

  return (
    <div>
      <PageHeader
        title="Fechamento"
        description="Fechamento mensal com snapshot historico por transacao no banco"
        action={<Button onClick={() => setConfirm(true)}>Fechar mes</Button>}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">Vendidos: {totals.sold}</CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">Receita: {formatMoney(totals.revenue)}</CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">Comissao 30%: {formatMoney(commission)}</CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">Lucro liquido: {formatMoney(net)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Estoque inicial</TableHead>
                <TableHead>Vendido</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Lucro bruto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekItems.data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product?.name ?? '-'}</TableCell>
                  <TableCell>{item.start_stock}</TableCell>
                  <TableCell>{item.sold_qty}</TableCell>
                  <TableCell>{formatMoney(item.revenue)}</TableCell>
                  <TableCell>{formatMoney(item.cost_amount)}</TableCell>
                  <TableCell>{formatMoney(item.gross_profit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm}
        title="Fechar mes"
        description="Essa acao cria snapshot permanente e inicia o proximo mes automaticamente."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (!monthQuery.data?.id) return;
          mutations.closeMonth
            .mutateAsync(monthQuery.data.id)
            .then(() => toast.success('Mes fechado com sucesso'))
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Erro ao fechar mes'))
            .finally(() => setConfirm(false));
        }}
      />
    </div>
  );
}
