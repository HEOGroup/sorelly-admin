// Hellen e Diego estavam com a MESMA pessoa (46): quem entrava como Hellen caia na conta do Diego (10/11/2026).
// Este script passa a Hellen para a pessoa 55 (livre). Faz copia de seguranca da conta antes e so troca se ainda for 46.
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/corrigir-hellen-pessoa.mjs
import { consulta, pool } from "../../src/server/db.js";

const LOGIN = "hellengarmier", NOVA = 55;
const uso = (await consulta("select login from sorelly.conta where pessoa_id = $1", [NOVA])).rows;
if (uso.length) { console.log("PARADO: a pessoa", NOVA, "ja esta em uso por", uso.map((x) => x.login).join(", ")); await pool().end(); process.exit(1); }
await consulta("create table if not exists sorelly.bkp_conta_hellen_10_11 as select * from sorelly.conta where login in ('hellengarmier','diegofranco')");
const r = await consulta("update sorelly.conta set pessoa_id = $1 where login = $2 and pessoa_id = 46 returning login, pessoa_id", [NOVA, LOGIN]);
console.log(r.rows.length ? "OK: " + JSON.stringify(r.rows[0]) : "Nada a trocar (a Hellen ja nao esta na pessoa 46).");
const c = await consulta("select login, pessoa_id from sorelly.conta where login in ('hellengarmier','diegofranco') order by login");
console.log("Conferencia:", JSON.stringify(c.rows));
await pool().end();
