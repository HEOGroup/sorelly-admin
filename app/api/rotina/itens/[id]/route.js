export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, erro, rota, corpo } from "@/server/http";
import { consulta } from "@/server/db";
import { paraItem, validarItem } from "@/server/rotina";

export const PATCH = rota(async (req, { params }) => {
  const b = validarItem(await corpo(req), { criar: false }), sets = [], v = [params.id];
  const poe = (col, val, cast = "") => { v.push(val); sets.push(`${col} = $${v.length}${cast}`); };
  if (b.nome !== undefined) poe("nome", b.nome.trim());
  if (b.setor !== undefined) poe("setor", b.setor.trim());
  if (b.quem !== undefined) poe("pessoas", JSON.stringify(b.quem), "::jsonb");
  if (b.hora !== undefined) { v.push(b.hora); sets.push(`horario_limite = nullif($${v.length}, '')::time`); }
  if (b.dias !== undefined) poe("dias", b.dias);
  if (b.rota !== undefined) poe("rota", b.rota);
  if (b.ativo !== undefined) poe("ativo", b.ativo);
  if (!sets.length) return erro("Nada para mudar.", 400);
  const r = await consulta(`update sorelly.rotina_item set ${sets.join(", ")} where id = $1 returning *`, v);
  return r.rows[0] ? json({ item: paraItem(r.rows[0]) }) : erro("Item não encontrado.", 404);
}, { diretoria: true });

export const DELETE = rota(async (req, { params }) => {
  const r = await consulta("delete from sorelly.rotina_item where id = $1", [params.id]);
  return r.rowCount ? json({ ok: true }) : erro("Item não encontrado.", 404);
}, { diretoria: true });
