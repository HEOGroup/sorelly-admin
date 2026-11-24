// Tira o "Ajuste: diferença de R$ 3,00 nos pagamentos antigos" da Greicy Marcus (dívida dvmwtr7xfjt1i), pedido do Marcus em 24/11/2026:
// "tira ajuste de Greice; eu coloquei para você liquidar o Breno, não devo mais nada para ele". Guarda a linha numa cópia antes de remover.
// Uso: node --env-file-if-exists=.env.local scripts/tirar-ajuste-greicy.mjs [--gravar]
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const ID = "dvmwtr7xfjt1i";
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'")).rows[0].conteudo;
const d = (lido.dividas || []).find((x) => x.id === ID);
if (!d || d.valor !== 3 || !/Ajuste: diferença de R\$ 3,00/.test(d.descricao || "") || d.prestId !== "seed_prest_p4") { console.log("Linha não confere. Parei.", JSON.stringify(d)); await pool().end(); process.exit(1); }
console.log("Vai remover:", JSON.stringify(d));
if (!GRAVAR) { console.log("Simulação. Nada gravado. Rode com --gravar."); await pool().end(); process.exit(0); }
fs.writeFileSync("scripts/_copia-ff-ajuste-greicy.json", JSON.stringify(d, null, 1));
await gravarModulo("ff", {}, "patch", "tirar-ajuste-greicy-24-11", (g, n) => Object.assign({}, n, { dividas: ((g && g.dividas) || []).filter((x) => x.id !== ID) }));
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'")).rows[0].conteudo;
console.log("Restou a linha?", (dep.dividas || []).some((x) => x.id === ID), "| total de dívidas:", dep.dividas.length);
await pool().end();
