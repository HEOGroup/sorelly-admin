// Contas da Maria Claudia (RH, acesso igual ao da Priscila) e da Deysiane (supervisão da montagem), pedido do Marcus, 29/10/2026. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-contas-maria-deysiane.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const PESSOAS = [
  { nome: "Maria Claudia", login: "mariaclaudia", pessoa: 38, perfil: "ADMIN", grupo: "supervisao", setores: [] },
  { nome: "Deysiane", login: "deysiane", pessoa: 11, perfil: "MEMBER", grupo: null, setores: ["montagem", "producao", "encomendas"] },
];
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS senha_provisoria text");
for (const p of PESSOAS) {
  const ja = (await consulta("select status, senha_provisoria from sorelly.conta where login = $1 or pessoa_id = $2", [p.login, p.pessoa])).rows[0];
  if (ja) { console.log("já existe |", p.login, "|", ja.senha_provisoria || "(já trocou a senha)", "|", ja.status); continue; }
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, aprovado_por, senha_provisoria)
     values ($1, $2, $3, 'ativo', $4, $5, $6, $7, $8, 'Marcus', $9)`,
    [p.nome, p.login + "@interno.sorelly", await criarHash(senha), p.perfil, p.setores, p.pessoa, p.login, p.grupo, senha]);
  console.log("criada |", p.login, "|", senha);
}
await pool().end();
