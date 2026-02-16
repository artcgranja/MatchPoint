import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: { viewTransition: true },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "@e2b/code-interpreter", "e2b"],
  images: {
    remotePatterns: [{ hostname: "avatars.githubusercontent.com" }],
  },
  async redirects() {
    return [
      {
        source: "/search",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
