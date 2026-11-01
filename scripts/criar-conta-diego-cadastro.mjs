// Conta do Diego Franco (prestador do tráfego pago): só Cadastro de revendedoras e SorellyChat (pedido do Marcus, 01/11/2026). Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-conta-diego-cadastro.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const NOME = "Diego Franco", LOGIN = "diegofranco", CID = "f_diegofranco";
const ja = (await consulta("select login, senha_provisoria, status from sorelly.conta where login = $1", [LOGIN])).rows[0];
if (ja) console.log("já existe |", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)", "|", ja.status);
else {
  const PESSOA = Number((await consulta("select coalesce(max(pessoa_id),0)+1 as n from sorelly.conta")).rows[0].n);
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, abas, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',array['cadastro']::text[],array['set_cadastro']::text[],$4,$5,'basico',$6,'Marcus',$7)`,
    [NOME, LOGIN + "@interno.sorelly", await criarHash(senha), PESSOA, LOGIN, CID, senha]);
  console.log("criada |", NOME, "|", LOGIN, "|", senha, "| pessoa", PESSOA);
}
const v = (await consulta("select login, status, setores, abas, grupo from sorelly.conta where login = $1", [LOGIN])).rows[0];
console.log(JSON.stringify(v));
await pool().end();
