// Majorry bipa retorno e envio e atende revendedoras: mesmo acesso das bipadoras (pedido do Marcus, 30/10/2026). Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-majorry-bipagem.mjs
import { consulta, pool } from "../src/server/db.js";
const r = await consulta("update sorelly.conta set grupo='bipadora', setores=$1, abas=null where login='majorry' returning login, grupo, setores, abas", [["montagem"]]);
console.log(r.rowCount, JSON.stringify(r.rows));
await pool().end();
