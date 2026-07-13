import { useState } from 'react';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClosingDetails, useClosings } from '@/hooks/useInventory';
import { exportToCsv, exportToExcel, exportToPdf } from '@/services/exportService';
import { formatDate, formatMoney } from '@/utils/format';

export function HistoryPage() {
  const closings = useClosings();
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const details = useClosingDetails(selected);

  return (
    <div>
      <PageHeader
        title="Historico"
        description="Meses fechados com snapshots imutaveis"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCsv('historico', details.data?.items ?? [])}
              disabled={!details.data?.items?.length}
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel('historico', details.data?.items ?? [])}
              disabled={!details.data?.items?.length}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPdf('Historico Mensal', 'historico', details.data?.items ?? [])}
              disabled={!details.data?.items?.length}
            >
              PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Meses fechados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {closings.data?.map((closing) => (
              <button
                key={closing.id}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-secondary"
                onClick={() => setSelected(closing.id)}
              >
                {closing.year}/{String(closing.month).padStart(2, '0')} - {formatDate(closing.closed_at)}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque inicial</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Vendido</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.data?.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell>{item.start_stock}</TableCell>
                    <TableCell>{item.final_stock}</TableCell>
                    <TableCell>{item.sold_qty}</TableCell>
                    <TableCell>{formatMoney(item.revenue)}</TableCell>
                    <TableCell>{formatMoney(item.gross_profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
