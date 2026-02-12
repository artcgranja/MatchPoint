import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Fira_Code } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020810" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "MatchPoint — Matching de Startups com IA",
    template: "%s | MatchPoint",
  },
  description:
    "Plataforma de matching corporativo-startup com inteligência artificial. Descreva seu desafio e nossos agentes encontram as melhores startups para sua empresa.",
  keywords: [
    "matching startups",
    "inteligência artificial",
    "inovação corporativa",
    "open innovation",
    "corporate venture",
    "MatchPoint",
  ],
  authors: [{ name: "Astro Intelligence" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "MatchPoint",
    title: "MatchPoint — Matching de Startups com IA",
    description:
      "Descreva seu desafio e nossos agentes de IA encontram as melhores startups para sua empresa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchPoint — Matching de Startups com IA",
    description:
      "Descreva seu desafio e nossos agentes de IA encontram as melhores startups para sua empresa.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${firaCode.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-highlight focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo principal
        </a>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
