// Conta da Thaina Cristina Idalgo (representante): RH e SorellyChat (pedido da Maria/Marcus, 30/10/2026). Mesmo acesso da Ana Paula: básico + telas do RH. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-conta-thaina-rh.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../../src/server/db.js";
import { criarHash } from "../../src/server/senha.js";

const NOME = "Thaina Cristina Idalgo", LOGIN = "thaina", PESSOA = 52, CID = "r_thainacristinaidalgo";   // representante: id de chat começa com r_
const ja = (await consulta("select login, senha_provisoria, status from sorelly.conta where login = $1 or pessoa_id = $2", [LOGIN, PESSOA])).rows[0];
if (ja) console.log("já existe |", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)", "|", ja.status);
else {
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, abas, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',array['rh']::text[],array['set_rh']::text[],$4,$5,'basico',$6,'Marcus',$7)`,
    [NOME, LOGIN + "@interno.sorelly", await criarHash(senha), PESSOA, LOGIN, CID, senha]);
  console.log("criada |", NOME, "|", LOGIN, "|", senha);
}
await pool().end();
