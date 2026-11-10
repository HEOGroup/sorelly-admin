export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Produtos novos da DevMaster para a tela Marketing › Fotos de catálogo (só leitura; cache de 2 min).
//   GET /api/fotos/dm?dias=60   produtos cadastrados nos últimos 60 dias, com a marca de foto já subida
// Quem abre: Marketing e Diretoria (mesma regra do módulo fc).
import { json, erro, rota, invalido } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { produtosRecentes } from "@/server/fotos-dm";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "fc")) return erro("Você não tem acesso a este módulo.", 403);
  const d = url.searchParams.get("dias");
  if (d !== null && !/^\d{1,3}$/.test(d)) throw invalido("dias");
  const dias = Math.min(400, Math.max(1, d ? Number(d) : 60));
  return json(await produtosRecentes({ dias, forcar: url.searchParams.get("atualizar") === "1" }));
});
