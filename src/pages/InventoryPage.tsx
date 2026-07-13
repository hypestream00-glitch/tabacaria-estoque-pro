import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategories, useInventoryMutations, useProducts } from '@/hooks/useInventory';
import { exportToCsv, exportToExcel, exportToPdf } from '@/services/exportService';
import { formatMoney } from '@/utils/format';

const PAGE_SIZE = 10;

export function InventoryPage() {
  const categories = useCategories();
  const products = useProducts();
  const mutations = useInventoryMutations();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (products.data ?? [])
      .filter((item) => item.active)
      .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
      .filter((item) => (categoryFilter ? item.category_id === categoryFilter : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products.data, search, categoryFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = filtered.reduce(
    (acc, item) => {
      acc.qty += item.current_stock;
      acc.invested += item.current_stock * item.cost_price;
      acc.potential += item.current_stock * item.sale_price;
      return acc;
    },
    { qty: 0, invested: 0, potential: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Acompanhe estoque atual, potencial e itens em baixa"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  'estoque',
                  filtered.map((item) => ({
                    nome: item.name,
                    categoria: item.category?.name ?? '-',
                    estoque: item.current_stock,
                    custo: item.cost_price,
                    venda: item.sale_price
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
                  'estoque',
                  filtered.map((item) => ({
                    nome: item.name,
                    categoria: item.category?.name ?? '-',
                    estoque: item.current_stock,
                    custo: item.cost_price,
                    venda: item.sale_price
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
                  'Relatorio de Estoque',
                  'estoque',
                  filtered.map((item) => ({
                    nome: item.name,
                    categoria: item.category?.name ?? '-',
                    estoque: item.current_stock,
                    custo: item.cost_price,
                    venda: item.sale_price
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
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input placeholder="Pesquisar por nome" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="h-10 rounded-md border border-input bg-background px-3" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas categorias</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="text-sm text-muted-foreground">Itens: {filtered.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Investido</TableHead>
                <TableHead>Potencial</TableHead>
                <TableHead>Situacao</TableHead>
                <TableHead>Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => {
                const isLow = item.current_stock <= item.minimum_stock;
                return (
                  <TableRow key={item.id} className={isLow ? 'bg-red-950/40' : undefined}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category?.name ?? '-'}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>{formatMoney(item.cost_price)}</TableCell>
                    <TableCell>{formatMoney(item.sale_price)}</TableCell>
                    <TableCell>{formatMoney(item.current_stock * item.cost_price)}</TableCell>
                    <TableCell>{formatMoney(item.current_stock * item.sale_price)}</TableCell>
                    <TableCell>{isLow ? <Badge variant="destructive">Estoque baixo</Badge> : <Badge variant="secondary">Ok</Badge>}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="destructive" onClick={() => setToArchive(item.id)}>
                        Arquivar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4 text-sm text-muted-foreground">
            <div>Total itens: {filtered.length}</div>
            <div>Total em estoque: {totals.qty}</div>
            <div>Investido: {formatMoney(totals.invested)}</div>
            <div>Potencial: {formatMoney(totals.potential)}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= filtered.length} onClick={() => setPage((p) => p + 1)}>
                Proxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(toArchive)}
        title="Arquivar produto"
        description="O produto sera arquivado e o historico sera preservado. Deseja continuar?"
        onCancel={() => setToArchive(null)}
        onConfirm={() => {
          if (!toArchive) return;
          mutations.archiveProduct
            .mutateAsync(toArchive)
            .then(() => toast.success('Produto arquivado com sucesso'))
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Erro ao arquivar'))
            .finally(() => setToArchive(null));
        }}
      />
    </div>
  );
}
