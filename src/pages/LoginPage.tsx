import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { signInSchema } from '@/types/schemas';

type SignInValues = z.infer<typeof signInSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (values: SignInValues) => {
    try {
      await signIn(values.email, values.password);
      toast.success('Login realizado com sucesso');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no login');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-2xl font-semibold">Entrar</h1>
        <div>
          <Input type="email" placeholder="E-mail" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
        </div>
        <div>
          <Input type="password" placeholder="Senha" {...register('password')} />
          {errors.password ? <p className="mt-1 text-xs text-red-400">{errors.password.message}</p> : null}
        </div>
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Acessar'}
        </Button>
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link to="/cadastro-auth">Criar conta</Link>
          <Link to="/recuperar-senha">Esqueci a senha</Link>
        </div>
      </form>
    </div>
  );
}
