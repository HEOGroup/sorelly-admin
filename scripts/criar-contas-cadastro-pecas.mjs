// Contas da Rayssa e da Graziella (Cadastro de peças), pedido do Marcus, 29/10/2026. Login pelo nome, senha provisória. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-contas-cadastro-pecas.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const PESSOAS = [["Rayssa Alessandra Ingatain", "rayssa", 42], ["Graziella de Antoni dos Anjos", "graziella", 43]];
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS senha_provisoria text");
for (const [nome, login, pessoa] of PESSOAS) {
  const ja = (await consulta("select status, senha_provisoria from sorelly.conta where login=$1 or pessoa_id=$2", [login, pessoa])).rows[0];
  if (ja) { console.log("já existe |", login, "|", ja.senha_provisoria || "(já trocou a senha)"); continue; }
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',$4,$5,$6,'cadastropecas','Marcus',$7)`,
    [nome, login + "@interno.sorelly", await criarHash(senha), ["pecas"], pessoa, login, senha]);
  console.log("criada |", login, "|", senha);
}
await pool().end();
