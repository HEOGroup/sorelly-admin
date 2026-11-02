// Contas das meninas da Garantia (Trocas), pedido do Marcus, 30/10/2026: acesso básico (Início, SorellyChat, Melhorias) + a tela Garantia. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-contas-garantia.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../../src/server/db.js";
import { criarHash } from "../../src/server/senha.js";

const PESSOAS = [
  ["Giovanna Franco Rodrigues", 53, "giovannafranco", "f_giovannafrancorodrigues"],
  ["Ana Paula Slovinski", 54, "anapaulaslovinski", "f_anapaulaslovinski"],
];
for (const [nome, pessoaId, login, cid] of PESSOAS) {
  const ja = (await consulta("select login, senha_provisoria, status from sorelly.conta where pessoa_id = $1 or login = $2", [pessoaId, login])).rows[0];
  if (ja) { console.log("já existe |", nome, "|", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)", "|", ja.status); continue; }
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, abas, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',array['garantia']::text[],array['set_garantia']::text[],$4,$5,'basico',$6,'Marcus',$7)`,
    [nome, login + "@interno.sorelly", await criarHash(senha), pessoaId, login, cid, senha]);
  console.log("criada |", nome, "|", login, "|", senha);
}
await pool().end();
