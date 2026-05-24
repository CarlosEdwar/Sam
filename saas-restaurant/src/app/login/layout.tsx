'use client';

import { ThemeProvider } from '@/components/theme-provider';

/**
 * Layout dedicado à rota /login.
 * Força tema claro (forcedTheme="light") para que o Clerk nunca
 * receba a classe `dark` no elemento <html> nesta página.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
