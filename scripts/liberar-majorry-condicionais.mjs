// Majorry (Condicionais e listagens): Acesso básico + telas Painel (Listagens) e Condicionais (pedido do Marcus, 30/10/2026). Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-majorry-condicionais.mjs
import { consulta, pool } from "../src/server/db.js";
const r = await consulta("update sorelly.conta set abas=$1 where login='majorry' returning login, grupo, abas", [["painel", "condicionais"]]);
console.log(r.rowCount, JSON.stringify(r.rows));
await pool().end();
