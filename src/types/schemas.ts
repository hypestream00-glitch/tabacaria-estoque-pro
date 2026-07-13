import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Informe um e-mail valido'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres')
});

export const signUpSchema = signInSchema.extend({
  confirmPassword: z.string().min(6),
  tabacariaName: z.string().min(2, 'Informe o nome da tabacaria')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas nao conferem',
  path: ['confirmPassword']
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Nome obrigatorio'),
  category_id: z.string().uuid('Categoria obrigatoria'),
  cost_price: z.coerce.number().min(0, 'Custo deve ser >= 0'),
  sale_price: z.coerce.number().min(0, 'Venda deve ser >= 0'),
  initial_stock: z.coerce.number().int().min(0, 'Estoque inicial invalido'),
  minimum_stock: z.coerce.number().int().min(0, 'Estoque minimo invalido')
});

export const restockSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser maior que zero')
});

export const countedStockSchema = z.object({
  counted_stock: z.coerce.number().int().min(0, 'Nao pode ser negativo')
});

export const settingsSchema = z.object({
  tabacaria_name: z.string().min(2),
  commission_percent: z.coerce.number().min(0).max(100),
  currency: z.string().min(3).max(3),
  date_format: z.string().min(3),
  logo_url: z.string().url().optional().or(z.literal('')),
  sidebar_collapsed: z.boolean().default(false)
});
