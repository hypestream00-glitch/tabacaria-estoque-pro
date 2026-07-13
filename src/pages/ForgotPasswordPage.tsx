import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form
        className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          resetPassword(email)
            .then(() => toast.success('Email de recuperacao enviado'))
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Erro ao enviar email'))
            .finally(() => setLoading(false));
        }}
      >
        <h1 className="text-2xl font-semibold">Recuperar senha</h1>
        <Input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button className="w-full" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link'}
        </Button>
        <Link to="/login" className="block text-center text-sm text-muted-foreground">
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}
