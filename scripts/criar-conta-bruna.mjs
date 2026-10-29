// Conta da Bruna (Financeiro, acesso básico: só Início, Rotina, SorellyChat e Melhorias), pedido do Marcus, 29/10/2026.
// Ela usa o chat por enquanto e pede a foto ao Marketing. Telas novas entram depois. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-conta-bruna.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const ja = (await consulta("select status, senha_provisoria from sorelly.conta where login='brunarigos' or pessoa_id=36")).rows[0];
if (ja) console.log("já existe | brunarigos |", ja.senha_provisoria || "(já trocou a senha)");
else {
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ('Bruna Rigos','brunarigos@interno.sorelly',$1,'ativo','MEMBER',$2,36,'brunarigos','basico','f_brunarigos','Marcus',$3)`,
    [await criarHash(senha), [], senha]);
  console.log("criada | brunarigos |", senha);
}
await pool().end();
