import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: { viewTransition: true },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
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

export default nextConfig;
