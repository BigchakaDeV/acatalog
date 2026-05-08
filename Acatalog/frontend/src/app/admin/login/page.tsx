import { LoginForm } from '@/components/store/forms';

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-frost px-4">
      <section className="glass w-full max-w-md rounded-xl p-6">
        <p className="font-bold uppercase text-circuit">Acatalog Admin</p>
        <h1 className="mb-5 mt-2 text-2xl font-black">Login administrativo</h1>
        <LoginForm admin />
      </section>
    </main>
  );
}
