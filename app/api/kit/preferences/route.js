export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Configuração PÚBLICA do formulário "Preferências do kit" (sem login), lida pelo app da revendedora e pelo backend do app.
// Mesmo formato do GET /admin/kit/preferences do admin antigo: { version, blocks } (só blocos ativos, na ordem). Os blocos se editam em Kits › Preferências do kit › Formulário do app.
import { json, rota } from "@/server/http";
import { configPublica } from "@/server/montagem-kit";

const CAB = { "Cache-Control": "public, max-age=30", "Access-Control-Allow-Origin": "*" };
export const GET = rota(async () => {
  const r = json(await configPublica());
  Object.entries(CAB).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}, { publica: true });
export const OPTIONS = () => new Response(null, { status: 204, headers: { ...CAB, "Access-Control-Allow-Methods": "GET, OPTIONS" } });
