import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { signUpSchema } from '@/types/schemas';

type SignUpValues = z.infer<typeof signUpSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (values: SignUpValues) => {
    try {
      await signUp(values.email, values.password, values.tabacariaName);
      toast.success('Conta criada. Verifique seu e-mail para confirmar.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar conta');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <div>
          <Input placeholder="Nome da tabacaria" {...register('tabacariaName')} />
          {errors.tabacariaName ? <p className="mt-1 text-xs text-red-400">{errors.tabacariaName.message}</p> : null}
        </div>
        <div>
          <Input type="email" placeholder="E-mail" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email.message}</p> : null}
        </div>
        <div>
          <Input type="password" placeholder="Senha" {...register('password')} />
          {errors.password ? <p className="mt-1 text-xs text-red-400">{errors.password.message}</p> : null}
        </div>
        <div>
          <Input type="password" placeholder="Confirmar senha" {...register('confirmPassword')} />
          {errors.confirmPassword ? <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p> : null}
        </div>
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Cadastrar'}
        </Button>
        <Link to="/login" className="block text-center text-sm text-muted-foreground">
          Ja possui conta? Entrar
        </Link>
      </form>
    </div>
  );
}
