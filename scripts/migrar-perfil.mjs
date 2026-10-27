// Acrescenta às contas: foto, situação (disponível, em reunião, ausente), login pelo nome e menu por pessoa.
// Pode rodar quantas vezes quiser: só ACRESCENTA colunas, não apaga nem muda nada.
//   node --env-file-if-exists=.env.local scripts/migrar-perfil.mjs
import { consulta, pool } from "../src/server/db.js";

await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS foto text");
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS situacao text NOT NULL DEFAULT 'disponivel'");
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS perfil_em timestamptz NOT NULL DEFAULT now()");
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS login text");            // entrar pelo nome (ex.: nickolas, michele brito)
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS abas text[]");           // telas liberadas (vazio = as do grupo); "set_cadastro" libera um setor inteiro
await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS ocultar text[]");        // setores escondidos do menu
await consulta("CREATE UNIQUE INDEX IF NOT EXISTS conta_login_uq ON sorelly.conta (login) WHERE login IS NOT NULL");
const c = (await consulta("select column_name from information_schema.columns where table_schema='sorelly' and table_name='conta' and column_name in ('foto','situacao','perfil_em','login','abas','ocultar') order by 1")).rows.map((r) => r.column_name);
console.log("Colunas prontas:", c.join(", "));
await pool().end();
