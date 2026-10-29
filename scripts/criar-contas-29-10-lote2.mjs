// Contas de Thalyanny (antes escrita Thaylianny, corrigida em scripts/corrigir-thalyanny.mjs), Ana Paula (RH), Geovana Santos e Majorry (pedido do Marcus, 29/10/2026): Acesso básico (Início, SorellyChat, Melhorias) até o Marcus alinhar o que liberar. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-contas-29-10-lote2.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const PESSOAS = [
  ["Thalyanny Aparecida Jacob", 48, "thalyanny", "f_thalyannyaparecidajacob"],
  ["Ana Paula de Almeida Fernandes", 49, "anapaula", "f_anapauladealmeidafernandes"],
  ["Geovana Santos Neves", 50, "geovana", "f_geovanasantosneves"],
  ["Majorry Prost Fermino dos Santos", 23, "majorry", "f_majorryprostferminodossantos"],
];
for (const [nome, pessoaId, login, cid] of PESSOAS) {
  const ja = (await consulta("select login, senha_provisoria from sorelly.conta where pessoa_id = $1 or login = $2", [pessoaId, login])).rows[0];
  if (ja) { console.log("já existe |", nome, "|", ja.login, "|", ja.senha_provisoria || "(já trocou a senha)"); continue; }
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ($1,$2,$3,'ativo','MEMBER',$4,$5,$6,'basico',$7,'Marcus',$8)`,
    [nome, login + "@interno.sorelly", await criarHash(senha), [], pessoaId, login, cid, senha]);
  console.log("criada |", nome, "|", login, "|", senha);
}
await pool().end();
