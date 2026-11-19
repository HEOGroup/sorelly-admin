// Sorelly Admin · tira da fila do Direcionar os 4 pedidos que o Marcus disse que já foram pagos (12/11/2026):
// Francelle (teste, rep Nagela, R$ 1.505,94), Sabryna R$ 689,00, Gabrielle R$ 466,80, Camilla R$ 1.000,00.
// 2ª versão: grava null (lápide) em vez de tirar a chave, senão o navegador que ainda tem o pedido o devolve ao servidor (a cópia local sobe de novo).
// A cópia de segurança dos pedidos está em sorelly.bkp_fila_dp_12_11 (feita na 1ª versão).
import { pool } from "../../src/server/db.js";
var CHAVES = ["dp_pmw5e0i94p9v", "dp_PIIRVRD7303", "dp_PIIRVRD9926", "dp_PIIRVRD9369"];
var p = pool(), c = await p.connect();
try{
  await c.query("begin");
  await c.query("select 1 from sorelly.estado_modulo where modulo='pag' for update");
  for(var k of CHAVES){
    var r = await c.query("update sorelly.estado_modulo set conteudo = conteudo || jsonb_build_object($1::text, null), versao = versao + 1, atualizado_por = 'Claude (fila já paga)', atualizado_em = now() where modulo = 'pag' returning versao", [k]);
    await c.query("insert into sorelly.estado_modulo_log (modulo, versao, tipo, dados, por) values ('pag',$1::int,'apagar',$2::jsonb,'Claude (fila já paga)')", [r.rows[0].versao, JSON.stringify({[k]:null})]);
  }
  await c.query("commit");
  console.log("Lápide gravada nas 4 chaves.");
}catch(x){ await c.query("rollback"); console.log("ERRO: " + x.message); process.exitCode = 1; }
finally{ c.release(); await p.end(); }
