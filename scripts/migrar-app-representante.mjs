// Cria a tabela dos módulos "por item" do app real da representante (rpo e rpf: src/server/estado-itens.js). Pode rodar quantas vezes quiser.
// O servidor também cria sozinho na primeira chamada; este script serve para criar antes, num banco novo.
//   node --env-file-if-exists=.env --env-file-if-exists=.env.local scripts/migrar-app-representante.mjs
import { consulta, pool } from "../src/server/db.js";

await consulta("CREATE SEQUENCE IF NOT EXISTS sorelly.estado_item_seq");
await consulta(`CREATE TABLE IF NOT EXISTS sorelly.estado_item (
  modulo text NOT NULL,
  chave text NOT NULL,
  valor jsonb NOT NULL,
  dono text NOT NULL,
  seq bigint NOT NULL DEFAULT nextval('sorelly.estado_item_seq'),
  atualizado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (modulo, chave)
)`);
await consulta("CREATE INDEX IF NOT EXISTS estado_item_seq_idx ON sorelly.estado_item (modulo, seq)");
const n = (await consulta("select modulo, count(*)::int n from sorelly.estado_item group by modulo order by modulo")).rows;
console.log("Tabela sorelly.estado_item pronta.", n.map((x) => `${x.modulo}: ${x.n}`).join(" · ") || "(vazia)");
await pool().end();
