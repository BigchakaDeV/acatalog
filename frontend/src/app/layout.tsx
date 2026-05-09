import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ToastProvider } from '@/components/ui/toast-provider';

export const metadata: Metadata = {
  title: 'Acatalog Tech',
  description: 'Hardware, periféricos, acessórios mobile e componentes profissionais.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const s = localStorage.getItem('acatalog_theme'); const d = window.matchMedia('(prefers-color-scheme: dark)').matches; const t = s === 'dark' || s === 'light' ? s : (d ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', t === 'dark'); } catch (_) {} })();`,
          }}
        />
      </head>
      <body>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
