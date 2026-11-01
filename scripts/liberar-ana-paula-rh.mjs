// Ana Paula de Almeida Fernandes (RH): acesso só ao RH, além do básico (Início, SorellyChat, Melhorias). Pedido da Maria/Marcus, 30/10/2026. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/liberar-ana-paula-rh.mjs
import { consulta, pool } from "../src/server/db.js";

const r = await consulta(
  `update sorelly.conta set setores = array['rh']::text[], abas = array['set_rh']::text[], atualizado_em = now()
    where pessoa_id = 49 returning login, nome, grupo, setores, abas, status, senha_provisoria`);
console.log(r.rowCount ? "liberada | " + JSON.stringify(r.rows[0]) : "NÃO ACHEI a conta da pessoa 49");
await pool().end();
