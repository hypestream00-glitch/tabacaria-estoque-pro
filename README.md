# Tabacaria Estoque Pro

Aplicacao web profissional de controle de estoque para tabacaria, com vendas calculadas automaticamente por contagem semanal e fechamento mensal em Supabase.

## Stack

- React + TypeScript + Vite
- Tailwind CSS + componentes estilo shadcn/ui
- React Router DOM
- TanStack React Query
- React Hook Form + Zod
- Lucide React
- Recharts
- Supabase + PostgreSQL + Supabase Auth

## Configuracao

1. Copie .env.example para .env:

   cp .env.example .env

2. Preencha:

   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key

3. Instale dependencias do projeto:

   pnpm install

4. Rode as migrations do Supabase:

   supabase db push

   ou execute no SQL Editor a migration:
   supabase/migrations/0020_tobacco_inventory.sql

## Rodar o app

pnpm dev

## Validacoes

pnpm typecheck
pnpm lint
pnpm build

## Regras de negocio chave

- Usuario informa apenas estoque contado
- Vendas e lucro sao calculados automaticamente
- Fechamento semanal e mensal via RPC transacional
- Snapshot historico imutavel em monthly_closing_items
- RLS por user_id em todas as tabelas privadas
- Sem service_role no frontend
