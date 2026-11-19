export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Preço e custo das peças da DevMaster (só leitura, cache de 6 h): só a Diretoria (o custo é dado de dinheiro). ?codigos=BB0252,P1826 ... ; ?agora=1 ignora o cache.
import { erro, json, rota } from "@/server/http";
import { produtosDaDevmaster } from "@/server/produtos-dm";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN") return erro("Só a Diretoria pode ver o custo das peças.", 403);
  const codigos = String(url.searchParams.get("codigos") || "").split(",").map((c) => c.trim()).filter(Boolean);
  if (!codigos.length) return json({ itens: {} });
  try { return json({ itens: await produtosDaDevmaster(codigos, { forcar: url.searchParams.get("agora") === "1" }) }); }
  catch (x) { return erro(x.message, x.statusCode || 500); }
});
