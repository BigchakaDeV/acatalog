'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { apiErrorMessage, authApi, storeApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton({ onSuccess }: { onSuccess?: () => void }) {
  const { notify } = useToast();
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const { mutate, isPending } = useMutation({
    mutationFn: (credential: string) => authApi.google(credential),
    onSuccess: () => {
      notify('Login Google realizado');
      onSuccess?.();
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;
    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !buttonRef.current) return;
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            notify('Nao foi possivel obter a credencial do Google.');
            return;
          }
          mutate(response.credential);
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width: buttonRef.current.offsetWidth || 320,
      });
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      const existingScript = document.getElementById('google-identity-services');
      if (existingScript) {
        existingScript.addEventListener('load', renderGoogleButton, { once: true });
      } else {
        const script = document.createElement('script');
        script.id = 'google-identity-services';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        script.onerror = () => notify('Nao foi possivel carregar o login do Google.');
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [clientId, mutate, notify]);

  if (!clientId) {
    return <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">Login Google indisponivel: configure NEXT_PUBLIC_GOOGLE_CLIENT_ID.</p>;
  }

  return (
    <div className="grid gap-2">
      <div ref={buttonRef} className="min-h-11 w-full" />
      {isPending ? <p className="text-sm font-semibold text-graphite">Validando login Google...</p> : null}
    </div>
  );
}

export function LoginForm({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [nextRoute, setNextRoute] = useState('');
  const { notify } = useToast();
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search).get('next') ?? '';
    if (next) setNextRoute(next);
    if (!admin) return;
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') ?? '';
    const passwordParam = params.get('password') ?? '';
    if (emailParam) setIdentifier(emailParam);
    if (passwordParam) setPassword(passwordParam);
    if (emailParam || passwordParam) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [admin]);
  const mutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      admin ? authApi.adminLogin(payload.email, payload.password) : authApi.login(payload.email, payload.password),
    onSuccess: () => {
      router.push(nextRoute || (admin ? '/admin' : '/conta'));
    },
    onError: (err) => {
      const message = apiErrorMessage(err);
      setError(message);
      notify(message);
    },
  });
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({ email: String(form.get('email')), password: String(form.get('password')) });
    }}>
      <input name="email" type={admin ? 'text' : 'email'} placeholder={admin ? 'E-mail ou usuario administrativo' : 'E-mail'} value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="password" type="password" placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white">{mutation.isPending ? 'Entrando...' : admin ? 'Entrar no dashboard' : 'Entrar'}</button>
      {!admin ? <GoogleLoginButton onSuccess={() => router.push(nextRoute || '/conta')} /> : null}
      {!admin ? <button type="button" className="text-sm font-semibold text-circuit">Recuperar senha</button> : null}
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: (payload: Record<string, string>) => authApi.register(payload),
    onSuccess: () => router.push('/conta'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="mt-5 grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({
        username: String(form.get('email')).split('@')[0],
        first_name: String(form.get('first_name')),
        last_name: String(form.get('last_name')),
        email: String(form.get('email')),
        phone: String(form.get('phone')),
        password: String(form.get('password')),
      });
    }}>
      <input name="first_name" placeholder="Nome" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="last_name" placeholder="Sobrenome" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="email" type="email" placeholder="E-mail" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="phone" placeholder="Telefone" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="password" type="password" placeholder="Senha" className="min-h-11 rounded-lg border border-ink/10 px-3" required minLength={8} />
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-circuit px-4 font-bold text-white">{mutation.isPending ? 'Cadastrando...' : 'Cadastrar cliente'}</button>
    </form>
  );
}

export function AddressForm({ onCreated }: { onCreated?: () => void }) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: (payload: Record<string, string | boolean>) => storeApi.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      notify('Endereco salvo');
      onCreated?.();
    },
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      mutation.mutate({
        label: String(form.get('label') || 'Principal'),
        recipient: String(form.get('recipient')),
        phone: String(form.get('phone') || ''),
        zip_code: String(form.get('zip_code')),
        street: String(form.get('street')),
        number: String(form.get('number')),
        complement: String(form.get('complement') || ''),
        district: String(form.get('district')),
        city: String(form.get('city')),
        state: String(form.get('state')).toUpperCase(),
        is_default: true,
      });
    }}>
      <h3 className="flex items-center gap-2 text-lg font-black md:col-span-2"><MapPin className="h-5 w-5" /> Endereco de entrega</h3>
      <input name="label" placeholder="Apelido" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="recipient" placeholder="Nome do destinatario" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="phone" placeholder="Telefone" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <input name="zip_code" placeholder="CEP" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="street" placeholder="Rua" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="number" placeholder="Numero" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="district" placeholder="Bairro" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="city" placeholder="Cidade" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="state" placeholder="UF" className="min-h-11 rounded-lg border border-ink/10 px-3" required maxLength={2} />
      <input name="complement" placeholder="Complemento" className="min-h-11 rounded-lg border border-ink/10 px-3" />
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white md:col-span-2">{mutation.isPending ? 'Salvando...' : 'Salvar endereco'}</button>
    </form>
  );
}
