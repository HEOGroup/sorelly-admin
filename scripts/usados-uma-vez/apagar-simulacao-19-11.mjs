// Apaga a SIMULAÇÃO de 19/11/2026 (i_ISIM1119 em int e lf_LFISIM1119 em pag). Cópia em sorelly.bkp_testes_17_11; só apaga se o nome bate e a versão não mudou.
import { pool } from "../../src/server/db.js";
const p = pool();
await p.query("create table if not exists sorelly.bkp_testes_17_11 (feito_em timestamptz default now(), modulo text, chave text, valor jsonb)");
for (const [m, k] of [["int", "i_ISIM1119"], ["pag", "lf_LFISIM1119"]]) {
  const r = (await p.query("select conteudo, versao from sorelly.estado_modulo where modulo=$1", [m])).rows[0], v = r.conteudo[k];
  if (!v) { console.log(m, "já não existe"); continue; }
  if (!/simula/i.test(JSON.stringify(v).slice(0, 400))) { console.log(m, "NÃO BATE, não apaguei"); continue; }
  await p.query("insert into sorelly.bkp_testes_17_11 (modulo,chave,valor) values ($1,$2,$3::jsonb)", [m, k, JSON.stringify(v)]);
  const u = await p.query("update sorelly.estado_modulo set conteudo=conteudo-$1::text, versao=versao+1 where modulo=$2 and versao=$3", [k, m, r.versao]); console.log(m, "apagado:", u.rowCount);
}
await p.end();
