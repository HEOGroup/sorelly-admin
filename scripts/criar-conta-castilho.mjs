// Conta do Castilho (Marketing, acesso básico: Início, Rotina, SorellyChat e Melhorias), pedido do Marcus, 29/10/2026.
// Também liga a Hellen ao contato dela no SorellyChat (cid), que faltava. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-conta-castilho.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const h = await consulta("update sorelly.conta set cid='f_helengarmierdasilva' where login='hellengarmier' returning nome, cid");
console.log(h.rows[0] ? "chat da Hellen ligado | " + h.rows[0].cid : "NÃO ACHEI hellengarmier");
const ja = (await consulta("select status, senha_provisoria from sorelly.conta where login='castilho' or pessoa_id=47")).rows[0];
if (ja) console.log("já existe | castilho |", ja.senha_provisoria || "(já trocou a senha)");
else {
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, grupo, cid, aprovado_por, senha_provisoria)
     values ('Castilho','castilho@interno.sorelly',$1,'ativo','MEMBER',$2,47,'castilho','basico','f_castilho','Marcus',$3)`,
    [await criarHash(senha), ["marketing"], senha]);
  console.log("criada | castilho |", senha);
}
await pool().end();
