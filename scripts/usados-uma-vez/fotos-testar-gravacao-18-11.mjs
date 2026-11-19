// TESTE SEGURO: roda o UPDATE que grava a hora da leitura (m.dmEm) dentro de uma transação e DESFAZ no fim (ROLLBACK). Não deixa nada no banco.
import { pool } from "../../src/server/db.js";
const p = pool(), cli = await p.connect();
try {
  await cli.query("begin");
  const antes = (await cli.query("select versao, conteudo->'m'->>'dmEm' as dm_em, jsonb_typeof(conteudo->'m') as tipo_m from sorelly.estado_modulo where modulo='fc' for update")).rows[0];
  const agora = "2026-11-18T12:00:00";
  const u = await cli.query("update sorelly.estado_modulo set conteudo = jsonb_set(conteudo || $1::jsonb, '{m,dmEm}', to_jsonb($3::text), true), versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'fc' and versao = $2", [JSON.stringify({}), antes.versao, agora]);
  const depois = (await cli.query("select versao, conteudo->'m'->>'dmEm' as dm_em, jsonb_typeof(conteudo->'m') as tipo_m, (select count(*) from jsonb_object_keys(conteudo->'m')) as chaves_m from sorelly.estado_modulo where modulo='fc'")).rows[0];
  console.log("antes :", JSON.stringify(antes));
  console.log("update: linhas =", u.rowCount);
  console.log("depois:", JSON.stringify(depois), "(dentro da transação)");
} finally { await cli.query("rollback"); cli.release(); }
const real = (await p.query("select versao, conteudo->'m'->>'dmEm' as dm_em from sorelly.estado_modulo where modulo='fc'")).rows[0];
console.log("banco real depois do rollback:", JSON.stringify(real), "(a versão não deve ter avançado por este teste)");
await p.end();
