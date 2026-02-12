import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
      <Compass className="h-16 w-16 text-highlight mb-6" />
      <h1 className="text-6xl font-bold font-code">404</h1>
      <p className="mt-4 text-xl text-foreground-muted">
        Página não encontrada
      </p>
      <p className="mt-2 text-sm text-foreground-muted max-w-md">
        A página que você procura pode ter sido movida ou não existe.
        Vamos te colocar de volta no caminho certo.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
