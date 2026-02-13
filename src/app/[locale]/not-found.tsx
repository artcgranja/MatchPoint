import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("Errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
      <Compass className="h-16 w-16 text-highlight mb-6" />
      <h1 className="text-6xl font-bold font-code">{t("notFoundTitle")}</h1>
      <p className="mt-4 text-xl text-foreground-muted">
        {t("notFoundMessage")}
      </p>
      <p className="mt-2 text-sm text-foreground-muted max-w-md">
        {t("notFoundDescription")}
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">{t("backToHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
