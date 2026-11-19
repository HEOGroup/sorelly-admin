// Conta da Beatriz Mascencio Gomes (Marketing, CLT): acesso básico + o setor Marketing completo (todas as telas dele). Pedido do Marcus, 17/11/2026. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/criar-conta-beatriz-marketing.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../../src/server/db.js";
import { criarHash } from "../../src/server/senha.js";

const NOME = "Beatriz Mascencio Gomes", LOGIN = "beatriz", PESSOA = 61, CID = "f_beatrizmascenciogomes";
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS senha_provisoria text");
const ja = (await consulta("select login, status, senha_provisoria from sorelly.conta where login = $1 or pessoa_id = $2", [LOGIN, PESSOA])).rows[0];
if (ja) console.log("já existe |", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)", "|", ja.status);
else {
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, abas, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ($1, $2, $3, 'ativo', 'MEMBER', $4, $5, $6, $7, 'basico', $8, 'Marcus', $9)`,
    [NOME, LOGIN + "@interno.sorelly", await criarHash(senha), ["marketing"], ["set_marketing"], PESSOA, LOGIN, CID, senha]);
  console.log("criada |", LOGIN, "|", senha);
}
await pool().end();
