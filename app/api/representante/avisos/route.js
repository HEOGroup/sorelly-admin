export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// AVISOS OBRIGATÓRIOS do app da representante (24/11/2026). Quem leu fica em sorelly.estado_item, módulo "avrep", chave "lido_<código da conta>_<id do aviso>".
//   GET  /api/representante/avisos        -> conta de representante: {pendentes:[{id,titulo,itens}]} (os que ela ainda NÃO confirmou)
//                                            Diretoria: {avisos:[{id,titulo,lidos:[{cod,nome,em}]}]} (quem já leu cada aviso)
//   POST /api/representante/avisos {id}   -> a representante confirma "Li e entendi" desse aviso (uma vez só; repetir não muda a hora)
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { gravarItens } from "@/server/estado-itens";
import { AVISOS } from "@/apps/montagem/domain/avisos-rep";

const MODULO = "avrep";

export const GET = rota(async (req, { eu }) => {
  if (eu.repCod) {
    const r = await consulta("select chave from sorelly.estado_item where modulo = $1 and chave like $2", [MODULO, "lido\_" + eu.repCod + "\_%"]);
    const lidos = new Set(r.rows.map((x) => x.chave.slice(("lido_" + eu.repCod + "_").length)));
    return json({ pendentes: AVISOS.filter((a) => !lidos.has(a.id)) });
  }
  if (eu.perfil !== "ADMIN") return erro("Só a Diretoria ou a representante.", 403);
  const r = await consulta("select chave, valor from sorelly.estado_item where modulo = $1 and chave like 'lido\_%'", [MODULO]);
  const avisos = AVISOS.map((a) => ({ id: a.id, titulo: a.titulo, lidos: [] }));
  r.rows.forEach((x) => { const v = x.valor || {}; const a = avisos.find((y) => y.id === v.aviso); if (a) a.lidos.push({ cod: v.cod, nome: v.nome || "", em: v.em }); });
  return json({ avisos });
});

export const POST = rota(async (req, { eu }) => {
  if (!eu.repCod) return erro("Só a conta de representante confirma o aviso.", 403);
  const b = await corpo(req, 2048);
  const aviso = AVISOS.find((a) => a.id === b.id);
  if (!aviso) throw invalido("aviso");
  const chave = "lido_" + eu.repCod + "_" + aviso.id;
  const ja = await consulta("select 1 from sorelly.estado_item where modulo = $1 and chave = $2", [MODULO, chave]);
  if (!ja.rows.length) await gravarItens(MODULO, { [chave]: { aviso: aviso.id, cod: eu.repCod, nome: String(eu.nome || ""), em: new Date().toISOString() } }, "app", "rep:" + eu.repCod);
  return json({ ok: true });
});
