export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Agenda do Agendamento: todas as revendedoras com kit ativo (condicional aberto com devolução prevista até 120 dias à frente), lidas da DevMaster API 2 (só leitura, cache de 10 min).
//   GET /api/agenda-revendedoras            lista    |    ?atualizar=1 ignora o cache
// Quem abre: Agendamento (Ana Maria, Mariana, Tamara) e Diretoria (mesmo critério do módulo "ri").
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { listaAgenda } from "@/server/revendedoras";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "ri")) return erro("Só o Agendamento e a Diretoria abrem esta tela.", 403);
  return json(await listaAgenda({ forcar: url.searchParams.get("atualizar") === "1" }));
});
