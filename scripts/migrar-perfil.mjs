// Acrescenta foto e situação (disponível, em reunião, ausente) às contas. Pode rodar quantas vezes quiser: só ACRESCENTA colunas, não apaga nem muda nada.
//   node --env-file-if-exists=.env.local scripts/migrar-perfil.mjs
import { consulta, pool } from "../src/server/db.js";

await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS foto text");
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS situacao text NOT NULL DEFAULT 'disponivel'");
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS perfil_em timestamptz NOT NULL DEFAULT now()");
const c = (await consulta("select column_name from information_schema.columns where table_schema='sorelly' and table_name='conta' and column_name in ('foto','situacao','perfil_em') order by 1")).rows.map((r) => r.column_name);
console.log("Colunas do perfil prontas:", c.join(", "));
await pool().end();
