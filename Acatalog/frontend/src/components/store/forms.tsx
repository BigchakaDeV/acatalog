'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe2, MapPin } from 'lucide-react';
import { apiErrorMessage, authApi, storeApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';

export function GoogleLoginButton() {
  const { notify } = useToast();
  const [credential, setCredential] = useState('');
  const mutation = useMutation({
    mutationFn: () => authApi.google(credential),
    onSuccess: () => notify('Login Google realizado'),
    onError: (error) => notify(apiErrorMessage(error)),
  });
  return (
    <div className="grid gap-2">
      <input value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="Credential Google Identity Services" className="min-h-11 rounded-lg border border-ink/10 px-3 text-sm" />
      <button type="button" disabled={!credential || mutation.isPending} onClick={() => mutation.mutate()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white font-bold disabled:opacity-50">
        <Globe2 className="h-4 w-4" /> Entrar com Google
      </button>
    </div>
  );
}

export function LoginForm({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const { notify } = useToast();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      admin ? authApi.adminLogin(payload.email, payload.password) : authApi.login(payload.email, payload.password),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access);
      router.push(admin ? '/admin' : '/conta');
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
      <input name="email" type="email" placeholder={admin ? 'E-mail administrativo' : 'E-mail'} className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      <input name="password" type="password" placeholder="Senha" className="min-h-11 rounded-lg border border-ink/10 px-3" required />
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button disabled={mutation.isPending} className="min-h-11 rounded-lg bg-ink px-4 font-bold text-white">{mutation.isPending ? 'Entrando...' : admin ? 'Entrar no dashboard' : 'Entrar'}</button>
      {!admin ? <GoogleLoginButton /> : null}
      {!admin ? <button type="button" className="text-sm font-semibold text-circuit">Recuperar senha</button> : null}
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { notify } = useToast();
  const mutation = useMutation({
    mutationFn: (payload: Record<string, string>) => authApi.register(
      payload.email,
      payload.password,
      payload.username,
      payload.first_name,
      payload.last_name
    ),
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
    mutationFn: (payload: Record<string, string | boolean>) => storeApi.addAddress(payload),
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
