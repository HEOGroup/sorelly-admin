// Rotina do dia: o que cada pessoa tem que fazer por dia (rotina_item) e o check de feito de cada dia (rotina_registro).
// Mesmo desenho do sistema novo (src/apps/montagem/domain/rotina.js): item = {id, nome, setor, quem, hora, dias, rota, ativo}; registro = {itemId, data, em, por, porId}.
import { consulta } from "./db.js";
import { soDiretoria } from "./auth.js";

const DIA = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
const HORA = { type: "string", pattern: "^(\\d{2}:\\d{2})?$" };
const paraItem = (r) => ({ id: r.id, nome: r.nome, setor: r.setor, quem: r.pessoas || [], hora: r.horario_limite ? String(r.horario_limite).slice(0, 5) : "", dias: r.dias || [], rota: r.rota || "", ativo: r.ativo, ordem: r.ordem });

export async function rotasRotina(app) {
  const auth = { onRequest: [app.autenticar] };
  const dir = { onRequest: [app.autenticar, soDiretoria] };

  app.get("/rotina/itens", auth, async () => {
    const r = await consulta("select * from sorelly.rotina_item order by ordem, horario_limite nulls last, nome");
    return { itens: r.rows.map(paraItem) };
  });

  app.post("/rotina/itens", { ...dir, schema: { body: { type: "object", required: ["nome", "quem"], properties: {
    nome: { type: "string", minLength: 1 }, setor: { type: "string" }, quem: { type: "array", items: { type: "integer" }, minItems: 1 },
    hora: HORA, dias: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } }, rota: { type: "string" } } } } }, async (req, reply) => {
    const b = req.body, dias = b.dias?.length ? b.dias : [1, 2, 3, 4, 5, 6];
    const r = await consulta(
      `insert into sorelly.rotina_item (nome, setor, pessoas, horario_limite, dias, rota, ordem)
       values ($1, $2, $3::jsonb, nullif($4, '')::time, $5, $6, coalesce((select max(ordem) + 1 from sorelly.rotina_item), 0)) returning *`,
      [b.nome.trim(), (b.setor || "").trim(), JSON.stringify(b.quem), b.hora || "", dias, b.rota || ""]);
    return reply.code(201).send({ item: paraItem(r.rows[0]) });
  });

  app.patch("/rotina/itens/:id", { ...dir, schema: { body: { type: "object", properties: {
    nome: { type: "string", minLength: 1 }, setor: { type: "string" }, quem: { type: "array", items: { type: "integer" }, minItems: 1 },
    hora: HORA, dias: { type: "array", items: { type: "integer", minimum: 0, maximum: 6 } }, rota: { type: "string" }, ativo: { type: "boolean" } } } } }, async (req, reply) => {
    const b = req.body, sets = [], v = [req.params.id];
    const poe = (col, val, cast = "") => { v.push(val); sets.push(`${col} = $${v.length}${cast}`); };
    if (b.nome !== undefined) poe("nome", b.nome.trim());
    if (b.setor !== undefined) poe("setor", b.setor.trim());
    if (b.quem !== undefined) poe("pessoas", JSON.stringify(b.quem), "::jsonb");
    if (b.hora !== undefined) { v.push(b.hora); sets.push(`horario_limite = nullif($${v.length}, '')::time`); }
    if (b.dias !== undefined) poe("dias", b.dias);
    if (b.rota !== undefined) poe("rota", b.rota);
    if (b.ativo !== undefined) poe("ativo", b.ativo);
    if (!sets.length) return reply.code(400).send({ erro: "Nada para mudar." });
    const r = await consulta(`update sorelly.rotina_item set ${sets.join(", ")} where id = $1 returning *`, v);
    return r.rows[0] ? { item: paraItem(r.rows[0]) } : reply.code(404).send({ erro: "Item não encontrado." });
  });

  app.delete("/rotina/itens/:id", dir, async (req, reply) => {
    const r = await consulta("delete from sorelly.rotina_item where id = $1", [req.params.id]);
    return r.rowCount ? { ok: true } : reply.code(404).send({ erro: "Item não encontrado." });
  });

  // checks de um dia: { "<itemId>": {em, por, porId} }
  app.get("/rotina/registros", { ...auth, schema: { querystring: { type: "object", required: ["data"], properties: { data: DIA } } } }, async (req) => {
    const r = await consulta("select item_id, feito_em, por_nome, pessoa_id from sorelly.rotina_registro where data = $1 and feito", [req.query.data]);
    const reg = {}; r.rows.forEach((x) => { reg[x.item_id] = { em: new Date(x.feito_em).getTime(), por: x.por_nome || "", porId: x.pessoa_id }; });
    return { data: req.query.data, reg };
  });

  // marcar / desmarcar. Só quem faz o item (ou a Diretoria) marca; quem não é da Diretoria só marca o dia de hoje.
  app.put("/rotina/registros", { ...auth, schema: { body: { type: "object", required: ["itemId", "data", "feito"], properties: { itemId: { type: "string" }, data: DIA, feito: { type: "boolean" } } } } }, async (req, reply) => {
    const { itemId, data, feito } = req.body, eu = req.user, diretoria = eu.perfil === "ADMIN";
    const it = (await consulta("select id, pessoas from sorelly.rotina_item where id = $1", [itemId])).rows[0];
    if (!it) return reply.code(404).send({ erro: "Item não encontrado." });
    if (!diretoria && !(it.pessoas || []).includes(eu.pessoaId)) return reply.code(403).send({ erro: "Esse item é de outra pessoa." });
    const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);   // dia de Brasília
    if (!diretoria && data !== hoje) return reply.code(403).send({ erro: "Só dá para marcar o dia de hoje." });
    if (feito) {
      await consulta(
        `insert into sorelly.rotina_registro (item_id, data, feito, user_id, feito_em, por_nome, pessoa_id) values ($1, $2, true, $3, now(), $4, $5)
         on conflict (item_id, data) do update set feito = true, user_id = excluded.user_id, feito_em = now(), por_nome = excluded.por_nome, pessoa_id = excluded.pessoa_id`,
        [itemId, data, eu.id, eu.nome, eu.pessoaId ?? null]);
    } else {
      await consulta("delete from sorelly.rotina_registro where item_id = $1 and data = $2", [itemId, data]);
    }
    return { ok: true };
  });
}
