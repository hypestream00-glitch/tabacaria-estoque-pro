import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useCurrentMonth, useInventoryMutations, useWeekItems, useWeeks } from '@/hooks/useInventory';
import { formatMoney } from '@/utils/format';

export function WeeksPage() {
  const monthQuery = useCurrentMonth();
  const weeksQuery = useWeeks(monthQuery.data?.id);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const mutations = useInventoryMutations();

  const week = useMemo(() => weeksQuery.data?.find((item) => item.week_number === selectedWeek), [weeksQuery.data, selectedWeek]);
  const weekItemsQuery = useWeekItems(week?.id);

  const saveDebounced = useDebouncedCallback((itemId: string, value: number) => {
    mutations.saveCountedStock
      .mutateAsync({ itemId, countedStock: value })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Falha ao salvar contagem'));
  }, 600);

  const totals = (weekItemsQuery.data ?? []).reduce(
    (acc, item) => {
      acc.sold += item.sold_qty;
      acc.revenue += item.revenue;
      acc.cost += item.cost_amount;
      acc.profit += item.gross_profit;
      return acc;
    },
    { sold: 0, revenue: 0, cost: 0, profit: 0 }
  );

  return (
    <div>
      <PageHeader title="Semanas" description="Contagem semanal com calculo automatico de vendas" />

      <div className="mb-4 flex flex-wrap gap-2">
        {weeksQuery.data?.map((item) => (
          <Button key={item.id} variant={selectedWeek === item.week_number ? 'default' : 'outline'} onClick={() => setSelectedWeek(item.week_number)}>
            Semana {item.week_number}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque inicial</TableHead>
                <TableHead>Reposicoes</TableHead>
                <TableHead>Esperado</TableHead>
                <TableHead>Contado</TableHead>
                <TableHead>Vendido</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Lucro bruto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekItemsQuery.data?.map((item) => {
                const hasPending = item.counted_stock === null;
                return (
                  <TableRow key={item.id} className={hasPending ? 'bg-amber-950/20' : undefined}>
                    <TableCell>{item.product?.name ?? '-'}</TableCell>
                    <TableCell>{item.product?.category?.name ?? '-'}</TableCell>
                    <TableCell>{item.start_stock}</TableCell>
                    <TableCell>{item.restock_qty}</TableCell>
                    <TableCell>{item.expected_stock}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        disabled={Boolean(week?.is_finalized)}
                        defaultValue={item.counted_stock ?? ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!Number.isInteger(value) || value < 0) return;
                          saveDebounced(item.id, value);
                        }}
                      />
                    </TableCell>
                    <TableCell>{item.sold_qty}</TableCell>
                    <TableCell>{formatMoney(item.revenue)}</TableCell>
                    <TableCell>{formatMoney(item.gross_profit)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center gap-4 border-t border-border p-4 text-sm">
            <Badge variant="secondary">Vendido: {totals.sold}</Badge>
            <Badge variant="secondary">Receita: {formatMoney(totals.revenue)}</Badge>
            <Badge variant="secondary">Custo: {formatMoney(totals.cost)}</Badge>
            <Badge variant="secondary">Lucro bruto: {formatMoney(totals.profit)}</Badge>
            <div className="ml-auto flex gap-2">
              {!week?.is_finalized ? (
                <Button onClick={() => setConfirmFinalize(true)}>Finalizar semana</Button>
              ) : (
                <Button variant="outline" onClick={() => setConfirmReopen(true)}>
                  Reabrir semana
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmFinalize}
        title="Finalizar semana"
        description="Apos finalizar, os campos serao bloqueados e os estoques atualizados."
        onCancel={() => setConfirmFinalize(false)}
        onConfirm={() => {
          if (!week?.id) return;
          mutations.finalizeWeek
            .mutateAsync(week.id)
            .then(() => toast.success('Semana finalizada com sucesso'))
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Erro ao finalizar semana'))
            .finally(() => setConfirmFinalize(false));
        }}
      />

      <ConfirmDialog
        open={confirmReopen}
        title="Reabrir semana"
        description="Ao reabrir, os valores posteriores podem ser recalculados."
        onCancel={() => setConfirmReopen(false)}
        onConfirm={() => {
          if (!week?.id) return;
          mutations.reopenWeek
            .mutateAsync(week.id)
            .then(() => toast.success('Semana reaberta com sucesso'))
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Erro ao reabrir semana'))
            .finally(() => setConfirmReopen(false));
        }}
      />
    </div>
  );
}
