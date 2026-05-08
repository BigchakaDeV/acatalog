import { Header } from '@/components/store/header';
import { Footer } from '@/components/store/footer';
import { LoginForm, RegisterForm } from '@/components/store/forms';

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
        <section className="glass rounded-xl p-6"><h1 className="text-2xl font-black">Entrar na conta</h1><p className="mb-5 mt-2 text-sm text-graphite">Login do cliente separado do administrativo.</p><LoginForm /></section>
        <section className="surface rounded-lg p-6"><h2 className="text-2xl font-black">Criar cadastro</h2><RegisterForm /></section>
      </main>
      <Footer />
    </>
  );
}
