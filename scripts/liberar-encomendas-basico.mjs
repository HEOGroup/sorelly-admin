// Elen, Agatha e Eduarda Gabriela (29/10/2026): Acesso básico + setor Encomendas sem a tela "Regras e mensagens". Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-encomendas-basico.mjs
import { consulta, pool } from "../src/server/db.js";
const abas = ["encomendas", "encida", "enctop50", "encrep", "expositores"];
const r = await consulta("update sorelly.conta set grupo='basico', setores=$1, abas=$2, ocultar=null where pessoa_id = any($3::int[]) returning login, grupo, setores, abas", [["encomendas"], abas, [39, 40, 41]]);
console.log(r.rowCount, JSON.stringify(r.rows.map((x) => [x.login, x.grupo, x.setores, x.abas])));
await pool().end();
