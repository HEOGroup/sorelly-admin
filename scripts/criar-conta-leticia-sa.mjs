// Conta da Leticia de Sá Vargas (SAC), pedido do Marcus em 29/10/2026: setor Agendamento + SorellyChat e Início (os dois já são de todo mundo). Pode rodar de novo (não duplica).
//   node --env-file-if-exists=.env.local scripts/criar-conta-leticia-sa.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const NOME = "Leticia de Sá Vargas", LOGIN = "leticiasa", CID = "f_leticiadesavargas";
const ja = (await consulta("select login, senha_provisoria from sorelly.conta where login = $1 or cid = $2", [LOGIN, CID])).rows[0];
if (ja) { console.log("já existe |", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)"); }
else {
  const prox = Number((await consulta("select coalesce(max(pessoa_id),0)+1 as p from sorelly.conta")).rows[0].p);
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',$4,$5,$6,'basico',$7,'Marcus',$8)`,
    [NOME, LOGIN + "@interno.sorelly", await criarHash(senha), ["agendamento"], prox, LOGIN, CID, senha]);
  console.log("criada |", NOME, "| pessoa", prox, "|", LOGIN, "|", senha);
}
await pool().end();
