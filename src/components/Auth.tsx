import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { login, register } from '@/lib/player';
import { toast } from 'sonner';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'register') await register(email, password, name || 'Игрок');
      else await login(email, password);
      toast.success('Добро пожаловать!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md animate-float-up rounded-3xl glass grid-bg p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-2xl neon-border">🚀</div>
          <h1 className="font-display text-3xl neon-text">IRRELEVANT KAZINO</h1>
          <p className="mt-1 text-sm text-muted-foreground">Валюта Plazma Coin · вход по почте</p>
        </div>

        <div className="mb-5 flex rounded-xl bg-secondary p-1">
          {(['register', 'login'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm transition ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {m === 'register' ? 'Регистрация' : 'Вход'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'register' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя (ник)"
              className="w-full rounded-xl bg-secondary px-4 py-3 outline-none focus:neon-border" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Почта Google (email)"
            className="w-full rounded-xl bg-secondary px-4 py-3 outline-none focus:neon-border" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Пароль (от 6 символов)"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-xl bg-secondary px-4 py-3 outline-none focus:neon-border" />
          <Button onClick={submit} disabled={busy} className="h-12 w-full font-display text-base">
            <Icon name={mode === 'register' ? 'UserPlus' : 'LogIn'} size={18} className="mr-2" />
            {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Новым игрокам — 1000 Plazma в подарок. Обмен валюты — в Telegram-чате.
        </p>
      </div>
    </div>
  );
}
