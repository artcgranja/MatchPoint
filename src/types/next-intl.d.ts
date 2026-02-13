import type messages from "../../messages/en.json";

type Messages = typeof messages;

declare module "next-intl" {
  interface AppConfig {
    Locale: "en" | "pt-BR";
    Messages: Messages;
  }
}
