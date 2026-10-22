export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Rotina do dia: o que cada pessoa tem que fazer por dia (rotina_item) e o check de feito de cada dia (rotina_registro).
// Mesmo desenho do sistema novo (src/apps/montagem/domain/rotina.js): item = {id, nome, setor, quem, hora, dias, rota, ativo}; registro = {itemId, data, em, por, porId}.
import { json, rota, corpo } from "@/server/http";
import { consulta } from "@/server/db";
import { paraItem, validarItem } from "@/server/rotina";

export const GET = rota(async () => {
  const r = await consulta("select * from sorelly.rotina_item order by ordem, horario_limite nulls last, nome");
  return json({ itens: r.rows.map(paraItem) });
});

export const POST = rota(async (req) => {
  const b = validarItem(await corpo(req), { criar: true });
  const dias = b.dias?.length ? b.dias : [1, 2, 3, 4, 5, 6];
  const r = await consulta(
    `insert into sorelly.rotina_item (nome, setor, pessoas, horario_limite, dias, rota, ordem)
     values ($1, $2, $3::jsonb, nullif($4, '')::time, $5, $6, coalesce((select max(ordem) + 1 from sorelly.rotina_item), 0)) returning *`,
    [b.nome.trim(), (b.setor || "").trim(), JSON.stringify(b.quem), b.hora || "", dias, b.rota || ""]);
  return json({ item: paraItem(r.rows[0]) }, 201);
}, { diretoria: true });
