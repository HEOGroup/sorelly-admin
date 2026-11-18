// TESTE SEGURO (desfeito no fim): o UPDATE do diário da leitura (m.dmTentativa e m.dmErro)
import { pool } from "../../src/server/db.js";
const p = pool(), cli = await p.connect();
try {
  await cli.query("begin");
  await cli.query("select 1 from sorelly.estado_modulo where modulo='fc' for update");
  const u = await cli.query("update sorelly.estado_modulo set conteudo = jsonb_set(jsonb_set(conteudo, '{m,dmTentativa}', to_jsonb($1::text), true), '{m,dmErro}', to_jsonb($2::text), true) where modulo = 'fc'", ["2026-11-18T12:30:00", ""]);
  const d = (await cli.query("select conteudo->'m'->>'dmTentativa' as t, conteudo->'m'->>'dmErro' as e, (select count(*) from jsonb_object_keys(conteudo->'m')) as chaves from sorelly.estado_modulo where modulo='fc'")).rows[0];
  console.log("linhas:", u.rowCount, "| dentro da transação:", JSON.stringify(d));
} finally { await cli.query("rollback"); cli.release(); }
const real = (await p.query("select conteudo->'m'->>'dmTentativa' as t from sorelly.estado_modulo where modulo='fc'")).rows[0];
console.log("banco real depois do rollback:", JSON.stringify(real));
await p.end();
