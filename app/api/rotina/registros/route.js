export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, erro, rota, corpo, invalido } from "@/server/http";
import { consulta } from "@/server/db";
import { DIA } from "@/server/rotina";

// checks de um dia: { "<itemId>": {em, por, porId} }
export const GET = rota(async (req, { url }) => {
  const data = url.searchParams.get("data");
  if (!data || !DIA.test(data)) throw invalido("data");
  const r = await consulta("select item_id, feito_em, por_nome, pessoa_id from sorelly.rotina_registro where data = $1 and feito", [data]);
  const reg = {}; r.rows.forEach((x) => { reg[x.item_id] = { em: new Date(x.feito_em).getTime(), por: x.por_nome || "", porId: x.pessoa_id }; });
  return json({ data, reg });
});

// marcar / desmarcar. Só quem faz o item (ou a Diretoria) marca; quem não é da Diretoria só marca o dia de hoje.
export const PUT = rota(async (req, { eu }) => {
  const b = await corpo(req);
  if (typeof b.itemId !== "string" || typeof b.data !== "string" || !DIA.test(b.data) || typeof b.feito !== "boolean") throw invalido("itemId, data e feito");
  const { itemId, data, feito } = b, diretoria = eu.perfil === "ADMIN";
  const it = (await consulta("select id, pessoas from sorelly.rotina_item where id = $1", [itemId])).rows[0];
  if (!it) return erro("Item não encontrado.", 404);
  if (!diretoria && !(it.pessoas || []).includes(eu.pessoaId)) return erro("Esse item é de outra pessoa.", 403);
  const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);   // dia de Brasília
  if (!diretoria && data !== hoje) return erro("Só dá para marcar o dia de hoje.", 403);
  if (feito) {
    await consulta(
      `insert into sorelly.rotina_registro (item_id, data, feito, user_id, feito_em, por_nome, pessoa_id) values ($1, $2, true, $3, now(), $4, $5)
       on conflict (item_id, data) do update set feito = true, user_id = excluded.user_id, feito_em = now(), por_nome = excluded.por_nome, pessoa_id = excluded.pessoa_id`,
      [itemId, data, eu.id, eu.nome, eu.pessoaId ?? null]);
  } else {
    await consulta("delete from sorelly.rotina_registro where item_id = $1 and data = $2", [itemId, data]);
  }
  return json({ ok: true });
});
