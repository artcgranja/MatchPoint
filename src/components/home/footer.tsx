"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Compass } from "lucide-react";

export function Footer() {
  const t = useTranslations("Landing");

  return (
    <footer className="border-t border-border-base py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-foreground">
              <Compass className="h-4 w-4 text-highlight" />
              <span className="text-sm font-heading font-semibold">{t("footerBrand")}</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-foreground-muted">
              {t("footerDescription")}
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label={t("footerLinks")} className="flex gap-12">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted/60">
                {t("footerProduct")}
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="#como-funciona" className="text-xs text-foreground-muted transition-colors hover:text-foreground">
                    {t("footerHowItWorks")}
                  </a>
                </li>
                <li>
                  <a href="#pipeline" className="text-xs text-foreground-muted transition-colors hover:text-foreground">
                    {t("footerPipeline")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-muted/60">
                {t("footerAccount")}
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/?login=1" className="text-xs text-foreground-muted transition-colors hover:text-foreground">
                    {t("footerSignIn")}
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border-base pt-6">
          <p className="text-xs text-foreground-muted/50">
            {t("footerCopyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
