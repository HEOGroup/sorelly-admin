export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Marketing › Modelos › Influencers: quantas revendedoras cada influencer trouxe pelo link (lê as indicações no app; só leitura).
//   GET /api/modelos/indicacoes?ids=12,34        contagem por ID no app (cache de 5 min)
//   GET /api/modelos/indicacoes?ids=12&atualizar=1   ignora o cache
//   GET /api/modelos/indicacoes?indicadas=12     quem ela indicou: nome, WhatsApp e situação de cada uma
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { contarIndicacoes, listarIndicadas } from "@/server/modelos-indicacoes";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "mod")) return erro("Você não tem acesso às Modelos.", 403);
  const unica = url.searchParams.get("indicadas");   // lista de quem ela indicou (nome e WhatsApp completos), só leitura
  if (unica) return json({ indicadas: await listarIndicadas(unica, { forcar: url.searchParams.get("atualizar") === "1" }) });
  const ids = String(url.searchParams.get("ids") || "").split(",").map((x) => x.trim()).filter(Boolean);
  return json({ contagens: await contarIndicacoes(ids, { forcar: url.searchParams.get("atualizar") === "1" }) });
});
