import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border-base py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-foreground">
              <Compass className="h-4 w-4 text-highlight" />
              <span className="text-sm font-heading font-semibold">MatchPoint</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
              Plataforma de matching corporativo-startup com inteligência artificial.
              Descreva seu desafio e nossos agentes encontram as melhores startups.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Links do rodapé" className="flex gap-12">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted/60">
                Produto
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="#como-funciona" className="text-xs text-foreground-muted transition-colors hover:text-foreground">
                    Como funciona
                  </a>
                </li>
                <li>
                  <a href="#pipeline" className="text-xs text-foreground-muted transition-colors hover:text-foreground">
                    Pipeline
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted/60">
                Conta
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-xs text-foreground-muted transition-colors hover:text-foreground">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border-base pt-6">
          <p className="text-xs text-foreground-muted/50">
            &copy; {new Date().getFullYear()} Astro Intelligence. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
