// Família com acesso a todos os setores, menos Configuradores (pedido do Marcus, 29/10/2026).
// Anamaria já tinha conta: só ganha todos os setores. Marco Antonio e Ana Beatriz ganham conta nova (login pelo nome, senha provisória). Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-familia.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";
import { SETORES_VALIDOS } from "../src/server/permissoes.js";

// MEMBER (não ADMIN): ADMIN abriria também a gestão de contas. Menu = grupo "familia" (tudo menos Configuradores).
const r = await consulta("update sorelly.conta set setores=$1, grupo='familia', atualizado_em=now() where login='anamariahess' returning nome, setores", [SETORES_VALIDOS]);
console.log(r.rows[0] ? "atualizada | " + r.rows[0].nome : "NÃO ACHEI anamariahess");
const NOVAS = [["Marco Antonio de Oliveira", "marcoantonio", 31], ["Ana Beatriz Hess de Oliveira", "anabeatriz", 30]];
for (const [nome, login, pessoa] of NOVAS) {
  const ja = (await consulta("select status, senha_provisoria from sorelly.conta where login=$1 or pessoa_id=$2", [login, pessoa])).rows[0];
  if (ja) { await consulta("update sorelly.conta set setores=$1, grupo='familia' where login=$2 or pessoa_id=$3", [SETORES_VALIDOS, login, pessoa]); console.log("já existe |", login, "|", ja.senha_provisoria || "(já trocou a senha)"); continue; }
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',$4,$5,$6,'familia','Marcus',$7)`,
    [nome, login + "@interno.sorelly", await criarHash(senha), SETORES_VALIDOS, pessoa, login, senha]);
  console.log("criada |", login, "|", senha);
}
await pool().end();
