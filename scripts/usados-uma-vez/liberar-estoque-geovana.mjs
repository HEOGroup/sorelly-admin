// Geovana (conta já criada em 29/10/2026, grupo básico): passa para o grupo "estoque" (só as telas de Estoque) e mostra o login e a senha provisória. Pedido do Marcus, 18/11/2026. Rodar SÓ depois que o grupo "estoque" estiver publicado na master. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/liberar-estoque-geovana.mjs
import { consulta, pool } from "../../src/server/db.js";
await consulta("update sorelly.conta set grupo = 'estoque' where login = 'geovana'");
const r = (await consulta("select login, grupo, status, senha_provisoria from sorelly.conta where login = 'geovana'")).rows[0];
console.log("login:", r.login, "| grupo:", r.grupo, "| situação:", r.status, "| senha provisória:", r.senha_provisoria || "(ela já trocou a senha)");
await pool().end();
