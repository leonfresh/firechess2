import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "de", "fr", "pt", "ru"],
  defaultLocale: "en",
  localePrefix: "as-needed", // /en/scan → /scan for default, /es/scan for others
});
