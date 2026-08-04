import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantido alinhado ao config efetivo (.mjs) para evitar regressão caso ele seja removido.
  output: "standalone",
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
