export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas e reposições › gerar o link de pedido da revendedora (vale 48 horas) e ver os últimos links.
//   GET  /api/encomendas/link                              → { links: [{ id, revendedora, estado, ... }] }
//   POST /api/encomendas/link { nome, cod, representante, telefone, cidade, media, taxa } → { id, validadeHoras }
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { HORAS_VALIDADE, criarLink, listarLinks } from "@/server/pedido-link";

export const GET = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  return json({ links: await listarLinks() });
});

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const b = await corpo(req, 16 * 1024);
  const id = await criarLink({ nome: b.nome, cod: b.cod, representante: b.representante, telefone: b.telefone, cidade: b.cidade, uf: b.uf, media: b.media, taxa: b.taxa, empresa: b.empresa === true, por: eu.nome });
  return json({ id, validadeHoras: HORAS_VALIDADE });
});
