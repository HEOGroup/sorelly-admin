// Conta da Hellen (Link de pagamento, Compras e estoque, Cadastro de revendedoras), pedido do Marcus, 28/10/2026. Login = nome, sem e-mail. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-conta-hellen.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const NOME = "Hellen Garmier", LOGIN = "hellengarmier", PESSOA = 46;
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS senha_provisoria text");
const ja = (await consulta("select status, senha_provisoria from sorelly.conta where login = $1", [LOGIN])).rows[0];
if (ja) console.log("já existe |", LOGIN, "|", ja.senha_provisoria || "(já trocou a senha)", "|", ja.status);
else {
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, aprovado_por, senha_provisoria)
     values ($1, $2, $3, 'ativo', 'MEMBER', $4, $5, $6, 'linkcadastro', 'Marcus', $7)`,
    [NOME, LOGIN + "@interno.sorelly", await criarHash(senha), ["linkpag", "cadastro"], PESSOA, LOGIN, senha]);
  console.log("criada |", LOGIN, "|", senha);
}
await pool().end();
