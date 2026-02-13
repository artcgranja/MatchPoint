import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");

  return {
    title: t("loginPageTitle"),
    description: t("loginPageDescription"),
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
