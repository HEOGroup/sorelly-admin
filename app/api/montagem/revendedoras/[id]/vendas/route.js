export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Ficha Montar kit: vendas da revendedora (3 últimas da DevMaster, venda no app e acerto previsto). Só leitura.
//   GET /api/montagem/revendedoras/:id/vendas?nome=NOME  →  { pronto, v:[{d,v}], vapp, prev, agendaEm, semCadastro }
import { erro, json, rota } from "@/server/http";
import { podeMontagem } from "@/server/montagem-kit";
import { vendasDaRevendedora } from "@/server/encomendas-vendas";

export const GET = rota(async (req, { eu, url, params }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem a Fila de montagem.", 403);
  const nome = String(url.searchParams.get("nome") || "").trim();
  if (!nome) return erro("Informe o nome da revendedora.", 400);
  return json(await vendasDaRevendedora(nome, Number(params.id)));
});
