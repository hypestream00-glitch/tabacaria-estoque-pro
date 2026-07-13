import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCategories, useInventoryMutations } from '@/hooks/useInventory';
import { productSchema } from '@/types/schemas';

type ProductFormValues = z.infer<typeof productSchema>;

export function CatalogPage() {
  const categories = useCategories();
  const mutations = useInventoryMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      cost_price: 0,
      sale_price: 0,
      minimum_stock: 0,
      initial_stock: 0
    }
  });

  const onSubmit = async (values: ProductFormValues) => {
    try {
      await mutations.createProduct.mutateAsync(values);
      toast.success('Produto cadastrado com sucesso');
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar produto');
    }
  };

  return (
    <div>
      <PageHeader title="Cadastro" description="Cadastre e mantenha os produtos da tabacaria" />
      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="md:col-span-2">
              <Input placeholder="Nome do produto" {...register('name')} />
              {errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name.message}</p> : null}
            </div>

            <div>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3" {...register('category_id')}>
                <option value="">Selecione a categoria</option>
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id ? <p className="mt-1 text-xs text-red-400">{errors.category_id.message}</p> : null}
            </div>

            <Input type="number" step="0.01" placeholder="Valor de custo" {...register('cost_price')} />
            <Input type="number" step="0.01" placeholder="Valor de venda" {...register('sale_price')} />
            <Input type="number" placeholder="Estoque inicial" {...register('initial_stock')} />
            <Input type="number" placeholder="Estoque minimo" {...register('minimum_stock')} />

            <div className="md:col-span-2">
              <Button disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar produto'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
