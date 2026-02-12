import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre com sua conta GitHub para acessar o MatchPoint.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
