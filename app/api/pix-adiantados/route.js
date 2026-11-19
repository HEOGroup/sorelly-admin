export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pix adiantado da revendedora (19/11/2026): o Atendimento interno pergunta quais Pix a revendedora já mandou a prestadores antes do acerto e marca os que o acerto consumiu.
//   GET  /api/pix-adiantados?nome=...&desde=AAAA-MM-DD&internoId=...  →  {pix:[{id, data, valor, conta, auditoria, compKey, meu}]}   (nunca devolve o nome do prestador)
//   POST /api/pix-adiantados  {internoId, rev, ids:[...]}  →  {marcados, soltos, recusados}   (idempotente: os ids são os Pix usados AGORA por esse atendimento)
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { listarPixAdiantados, marcarPixAdiantados } from "@/server/pix-adiantados";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "int")) return erro("Você não tem acesso ao Atendimento interno.", 403);
  const nome = url.searchParams.get("nome") || "";
  if (nome.trim().length < 3) return erro("Informe o nome da revendedora.", 400);
  const lista = await listarPixAdiantados({ nome, desde: url.searchParams.get("desde") || "", internoId: url.searchParams.get("internoId") || "" });
  // quem não abre o Financeiro familiar (módulo ff) vê só valor, data e a conta; o comprovante é do sócio
  const socio = podeModulo(eu, "ff");
  return json({ pix: lista.map((x) => ({ id: x.id, data: x.data, valor: x.valor, conta: x.conta, auditoria: x.auditoria, meu: x.meu, compKey: socio ? x.compKey : "" })) });
});

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "int")) return erro("Você não tem acesso ao Atendimento interno.", 403);
  const b = await corpo(req, 16 * 1024);
  const ids = Array.isArray(b.ids) ? b.ids.filter((x) => typeof x === "string" && /^[A-Za-z0-9_-]{3,40}$/.test(x)).slice(0, 20) : [];
  if (typeof b.internoId !== "string" || !b.internoId || typeof b.rev !== "string" || b.rev.trim().length < 3) return erro("Informe o atendimento e a revendedora.", 400);
  return json(await marcarPixAdiantados({ internoId: b.internoId, rev: b.rev, ids }, eu.nome || eu.id || ""));
});
