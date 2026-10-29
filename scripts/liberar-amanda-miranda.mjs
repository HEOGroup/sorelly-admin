// Conta da Amanda de Miranda (Inadimplência), pedido do Marcus, 29/10/2026. Ela já tinha criado a conta e estava "aguardando":
// liga à pessoa 32, define login e senha provisória e libera Inadimplência e Compras de joias. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-amanda-miranda.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const ja = (await consulta("select id, login, senha_provisoria from sorelly.conta where pessoa_id = 32")).rows[0];
if (ja) console.log("já ligada |", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)");
else {
  const c = (await consulta("select id from sorelly.conta where nome ilike 'Amanda de Miranda%' limit 1")).rows[0];
  if (!c) throw new Error("não achei a conta da Amanda de Miranda");
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `update sorelly.conta set status='ativo', perfil='MEMBER', setores=$2, pessoa_id=32, login='amandamiranda', grupo='inadimplencia', cid='f_amandademirandagoncalves', aprovado_por='Marcus', senha_hash=$3, senha_provisoria=$4 where id=$1`,
    [c.id, ["agendamento"], await criarHash(senha), senha]);
  console.log("liberada | amandamiranda |", senha);
}
await pool().end();
