/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,          // o sistema antigo não rodava em modo estrito; mantém igual
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["pg"] },
  webpack(config) {
    // import "x.md?raw" (usado em PadraoVisual.js) devolve o texto do arquivo, como no Vite
    config.module.rules.push({ resourceQuery: /raw/, type: "asset/source" });
    return config;
  },
};
export default nextConfig;
