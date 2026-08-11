import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // An unrelated lockfile in the user's home directory makes Next guess the
  // wrong workspace root; pin it to this project.
  outputFileTracingRoot: __dirname,
  // three is shipped as untranspiled ESM in places; let Next handle it.
  transpilePackages: ["three"],
  experimental: {
    optimizePackageImports: ["framer-motion", "@react-three/drei"],
  },
  async headers() {
    return [
      {
        // Models are content-hashed by name and never mutate in place.
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
