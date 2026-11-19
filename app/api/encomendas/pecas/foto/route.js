export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas › Separar peças: foto de UMA peça na DevMaster. GET /api/encomendas/pecas/foto?cod=SP0615  →  { url: "data:image/jpeg;base64,..." } ou { url: null }
import { json, erro, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { fotoDaPeca } from "@/server/separar-pecas";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const f = await fotoDaPeca(url.searchParams.get("cod"));
  return json({ url: f ? f.url : null });
});
