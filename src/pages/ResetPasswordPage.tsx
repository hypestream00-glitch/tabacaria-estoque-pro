import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form
        className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setLoading(true);
          updatePassword(password)
            .then(() => {
              toast.success('Senha alterada com sucesso');
              navigate('/dashboard', { replace: true });
            })
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha'))
            .finally(() => setLoading(false));
        }}
      >
        <h1 className="text-2xl font-semibold">Nova senha</h1>
        <Input type="password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button className="w-full" disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar senha'}
        </Button>
      </form>
    </div>
  );
}
