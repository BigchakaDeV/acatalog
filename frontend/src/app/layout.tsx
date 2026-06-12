import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ToastProvider } from '@/components/ui/toast-provider';

export const metadata: Metadata = {
  applicationName: 'Acatalog Tech',
  title: {
    default: 'Acatalog Tech',
    template: '%s | Acatalog Tech',
  },
  description: 'Hardware, perifericos, acessorios mobile e componentes profissionais.',
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
