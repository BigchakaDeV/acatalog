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
      <body>
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
