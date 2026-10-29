// Amanda de Miranda com acesso total, igual ao do Marcus (pedido dele, 29/10/2026): mesmo perfil e grupo da Priscila, da Maria Claudia e do Nickolas. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-amanda-total.mjs
import { consulta, pool } from "../src/server/db.js";
const r = await consulta("update sorelly.conta set perfil='ADMIN', grupo='supervisao', setores='{}', abas=null, ocultar=null where pessoa_id=32 returning login, perfil, grupo");
console.log(r.rowCount, JSON.stringify(r.rows));
await pool().end();
