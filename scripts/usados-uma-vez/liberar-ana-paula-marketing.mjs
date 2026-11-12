// Ana Paula de Almeida Fernandes (RH, pessoa 49): além do RH, abre Marketing, Fotos de catálogo e Criativos (acompanhar a meta de fotos). Pedido do Marcus, 11/11/2026. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/liberar-ana-paula-marketing.mjs
import { consulta, pool } from "../../src/server/db.js";

const r = await consulta(
  `update sorelly.conta
      set setores = (select array(select distinct unnest(coalesce(setores, '{}') || array['rh','marketing']))),
          abas = (select array(select distinct unnest(coalesce(abas, '{}') || array['set_rh','marketing','fotoscat','criativos']))),
          atualizado_em = now()
    where pessoa_id = 49 returning login, nome, grupo, setores, abas, status`);
console.log(r.rowCount ? "liberada | " + JSON.stringify(r.rows[0]) : "NÃO ACHEI a conta da pessoa 49");
await pool().end();
