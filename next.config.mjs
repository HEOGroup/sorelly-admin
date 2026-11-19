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
  env: { NEXT_PUBLIC_BUILD: process.env.VERCEL_GIT_COMMIT_SHA || "", NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.VERCEL ? "/api" : "") },
  reactStrictMode: false, // o sistema antigo não rodava em modo estrito; mantém igual
  poweredByHeader: false, // não anuncia "Next.js" no cabeçalho x-powered-by
  // O lint roda à parte (npm run lint e no CI): o build não para por aviso de estilo.
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["pg"] },
  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_SEGURANCA }];
  },
  webpack(config, { dev, isServer }) {
    // import "x.md?raw" (usado em PadraoVisual.js) devolve o texto do arquivo, como no Vite
    config.module.rules.push({ resourceQuery: /raw/, type: "asset/source" });
    // SERVIDOR QUE CAÍA (16/11/2026). No modo de desenvolvimento o Next desliga a divisão de pacotes no navegador (splitChunks: false).
    // Como src/router/rotas.js carrega cada tela com import() (mais de 200), cada tela virava um pacote com o sistema INTEIRO dentro:
    // 142 pacotes, os maiores com 50 MB, 3,1 GB a cada compilação. O Node enchia a memória (chegou a 13 GB) e o servidor travava ou reiniciava.
    // Aqui o código usado por 2 ou mais telas vai para UM pacote só ("comum-dev"); cada tela fica só com o que é dela.
    // Vale só para o `npm run dev`. O site publicado (build) não muda. Para desligar: variável SORELLY_SEM_DIVISAO=1.
    if (dev && !isServer && process.env.SORELLY_SEM_DIVISAO !== "1") {
      config.optimization.splitChunks = {
        chunks: "async",
        minSize: 0,
        cacheGroups: {
          default: false,
          defaultVendors: false,
          comum: { name: "comum-dev", chunks: "async", minChunks: 2, minSize: 0, priority: 10, enforce: true, reuseExistingChunk: true },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
