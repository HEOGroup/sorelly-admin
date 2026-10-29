// Corrige o nome da Thalyanny (estava Thaylianny) na conta: nome, login, e-mail interno, chat e senha provisória nova (pedido do Marcus, 29/10/2026).
// Pode rodar de novo: se o login já é thalyanny, só mostra a senha provisória atual.
//   node --env-file-if-exists=.env.local scripts/corrigir-thalyanny.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const NOME = "Thalyanny Aparecida Jacob", LOGIN = "thalyanny", CID = "f_thalyannyaparecidajacob", PESSOA = 48;
const c = (await consulta("select id, login, senha_provisoria from sorelly.conta where pessoa_id = $1", [PESSOA])).rows[0];
if (!c) throw new Error("não achei a conta da pessoa " + PESSOA);
if (c.login === LOGIN) console.log("já corrigida |", LOGIN, "|", c.senha_provisoria || "(já trocou a senha)");
else {
  const outra = (await consulta("select 1 from sorelly.conta where login = $1 and pessoa_id <> $2", [LOGIN, PESSOA])).rowCount;
  if (outra) throw new Error("o login " + LOGIN + " já existe em outra conta");
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta("update sorelly.conta set nome=$2, login=$3, email=$4, cid=$5, senha_hash=$6, senha_provisoria=$7 where id=$1", [c.id, NOME, LOGIN, LOGIN + "@interno.sorelly", CID, await criarHash(senha), senha]);
  console.log("corrigida |", NOME, "|", LOGIN, "|", senha);
}
await pool().end();
