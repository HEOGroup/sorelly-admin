/** @type {import('next').NextConfig} */

// Cabeçalhos de segurança em todas as respostas (telas e API).
// Câmera e microfone ficam liberados só para o próprio sistema: o SorellyChat usa os dois (foto e áudio).
const CABECALHOS_SEGURANCA = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

const nextConfig = {
  // Pasta de saída. Padrão .next; a conferência antes do push (npm run conferir) usa outra, para não derrubar o servidor ligado na porta 3000.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Na Vercel o login fica SEMPRE ligado (/api), mesmo que a variável não esteja cadastrada no painel. Fora dela, vale o .env.local (vazio = modo local).
  env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.VERCEL ? "/api" : "") },
  reactStrictMode: false, // o sistema antigo não rodava em modo estrito; mantém igual
  poweredByHeader: false, // não anuncia "Next.js" no cabeçalho x-powered-by
  // O lint roda à parte (npm run lint e no CI): o build não para por aviso de estilo.
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["pg"] },
  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_SEGURANCA }];
  },
  webpack(config) {
    // import "x.md?raw" (usado em PadraoVisual.js) devolve o texto do arquivo, como no Vite
    config.module.rules.push({ resourceQuery: /raw/, type: "asset/source" });
    return config;
  },
};

export default nextConfig;
