export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Funcionárias ativas do RH que também são clientes na DevMaster (ligação pelo CPF). Leitura somente; o CPF não sai do servidor.
// Usada pelo Atendimento Sorelly para aplicar a comissão de funcionária (Marcus, 11/11/2026).
//   GET /api/funcionarias             → {codigos, nomes, lista, geradoEm}   (cache de 30 min)
//   GET /api/funcionarias?atualizar=1 → lê de novo
// Quem pode: a Diretoria, o Agendamento e a Montagem (as meninas do atendimento).
import { erro, json, rota } from "@/server/http";
import { funcionariasAtivas } from "@/server/funcionarias";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).some((x) => x === "agendamento" || x === "montagem")) return erro("Só a Diretoria, o Agendamento e a Montagem podem ver isso.", 403);
  const d = await funcionariasAtivas({ forcar: url.searchParams.get("atualizar") === "1" });
  return json(d);
});
