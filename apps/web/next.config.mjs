import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config, { dev }) => {
    // Windows: persistent webpack cache can corrupt .next (ENOENT manifest / chunk errors).
    if (dev) {
      config.cache = false;
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "@ilanhub/shared": path.resolve(__dirname, "../../packages/shared/dist"),
      "@ilanhub/i18n": path.resolve(__dirname, "../../packages/i18n/dist"),
    };
    return config;
  },
};

export default nextConfig;
