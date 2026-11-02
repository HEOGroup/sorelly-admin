// Libera a tela "Pagas por dia" (Financeiro › Contas) para a Anamaria (02/11/2026, pedido dela em Melhorias): a conta guardava uma lista de telas feita antes dessa tela existir.
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/liberar-pagas-por-dia-anamaria.mjs
import { consulta, pool } from "../../src/server/db.js";
const r = await consulta("update sorelly.conta set abas = array_append(abas, 'pagaspordia') where login='anamariahess' and abas is not null and not ('pagaspordia' = any(abas)) returning login");
console.log("contas atualizadas:", r.rows.length);
await pool().end();
