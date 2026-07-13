import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useInventoryMutations, useSettings } from '@/hooks/useInventory';
import { settingsSchema } from '@/types/schemas';

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const settings = useSettings();
  const mutations = useInventoryMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (settings.data) {
      reset({
        tabacaria_name: settings.data.tabacaria_name,
        commission_percent: settings.data.commission_percent,
        currency: settings.data.currency,
        date_format: settings.data.date_format,
        logo_url: settings.data.logo_url ?? '',
        sidebar_collapsed: settings.data.sidebar_collapsed
      });
    }
  }, [settings.data, reset]);

  return (
    <div>
      <PageHeader title="Configuracoes" description="Personalize nome da loja, comissao e preferencias" />
      <Card>
        <CardContent className="p-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit(async (values) => {
              try {
                await mutations.upsertSettings.mutateAsync({
                  ...values,
                  logo_url: values.logo_url && values.logo_url.length > 0 ? values.logo_url : null
                });
                toast.success('Configuracoes salvas');
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuracoes');
              }
            })}
          >
            <Input placeholder="Nome da tabacaria" {...register('tabacaria_name')} />
            <Input type="number" step="0.01" placeholder="Comissao (%)" {...register('commission_percent')} />
            <Input placeholder="Moeda (BRL)" {...register('currency')} />
            <Input placeholder="Formato de data" {...register('date_format')} />
            <Input placeholder="URL da logo" {...register('logo_url')} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('sidebar_collapsed')} />
              Sidebar recolhida
            </label>
            <div className="md:col-span-2">
              <Button disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar configuracoes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
