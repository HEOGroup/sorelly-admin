// Acrescenta às contas: grupo de acesso (qual menu a pessoa vê) e o contato do chat. Pode rodar quantas vezes quiser: só ACRESCENTA colunas.
//   node --env-file-if-exists=.env.local scripts/migrar-grupo.mjs
import { consulta, pool } from "../src/server/db.js";

await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS grupo text");   // grupo de acesso do menu (montadora, bipadora, financeiro...); vazio = pela lista de pessoas do sistema
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS cid text");     // contato do SorellyChat desta pessoa (ex.: f_michelebrito)
const c = (await consulta("select column_name from information_schema.columns where table_schema='sorelly' and table_name='conta' and column_name in ('grupo','cid') order by 1")).rows.map((r) => r.column_name);
console.log("Colunas prontas:", c.join(", "));
await pool().end();
