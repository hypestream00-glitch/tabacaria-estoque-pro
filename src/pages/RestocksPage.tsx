import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentMonth, useInventoryMutations, useProducts, useRestocks } from '@/hooks/useInventory';
import { exportToCsv, exportToExcel, exportToPdf } from '@/services/exportService';
import { restockSchema } from '@/types/schemas';
import { formatDate } from '@/utils/format';

type RestockValues = z.infer<typeof restockSchema>;

export function RestocksPage() {
  const monthQuery = useCurrentMonth();
  const products = useProducts();
  const restocks = useRestocks(monthQuery.data?.id);
  const mutations = useInventoryMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<RestockValues>({
    resolver: zodResolver(restockSchema)
  });

  const onSubmit = async (values: RestockValues) => {
    try {
      await mutations.createRestock.mutateAsync(values);
      toast.success('Reposicao registrada com sucesso');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao repor estoque');
    }
  };

  return (
    <div>
      <PageHeader
        title="Reposicao"
        description="Registre entradas de estoque e acompanhe historico"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  'reposicoes',
                  (restocks.data ?? []).map((item) => ({
                    produto: item.product?.name ?? '-',
                    quantidade: item.quantity,
                    antes: item.stock_before,
                    depois: item.stock_after,
                    data: item.restocked_at
                  }))
                )
              }
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToExcel(
                  'reposicoes',
                  (restocks.data ?? []).map((item) => ({
                    produto: item.product?.name ?? '-',
                    quantidade: item.quantity,
                    antes: item.stock_before,
                    depois: item.stock_after,
                    data: item.restocked_at
                  }))
                )
              }
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToPdf(
                  'Historico de Reposicoes',
                  'reposicoes',
                  (restocks.data ?? []).map((item) => ({
                    produto: item.product?.name ?? '-',
                    quantidade: item.quantity,
                    antes: item.stock_before,
                    depois: item.stock_after,
                    data: item.restocked_at
                  }))
                )
              }
            >
              PDF
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Nova reposicao</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
            <select className="h-10 rounded-md border border-input bg-background px-3" {...register('product_id')}>
              <option value="">Selecione o produto</option>
              {products.data
                ?.filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.current_stock})
                  </option>
                ))}
            </select>
            <Input type="number" placeholder="Quantidade" {...register('quantity')} />
            <Button disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Repor estoque'}</Button>
          </form>
          {errors.quantity ? <p className="mt-2 text-xs text-red-400">{errors.quantity.message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de reposicoes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Antes</TableHead>
                <TableHead>Depois</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restocks.data?.map((restock) => (
                <TableRow key={restock.id}>
                  <TableCell>{restock.product?.name ?? '-'}</TableCell>
                  <TableCell>{restock.quantity}</TableCell>
                  <TableCell>{restock.stock_before}</TableCell>
                  <TableCell>{restock.stock_after}</TableCell>
                  <TableCell>{formatDate(restock.restocked_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
