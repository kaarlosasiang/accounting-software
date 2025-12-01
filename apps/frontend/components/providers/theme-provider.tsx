"use client";

import { ThemeProvider as NextThemeProvider, ThemeProviderProps } from "next-themes";

type Props = ThemeProviderProps;

export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}

