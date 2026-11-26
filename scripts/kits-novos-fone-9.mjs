// Põe o 9 na frente do celular nos Kits novos (módulo kndados), 26/11/2026 (Marcus: "falta um 9 na frente do numero").
// Mexe só em c1t, c2t, c3t, tel e dm.tel de celular com 10 dígitos (regra foneContato). Sem argumento = só simula. --aplicar = grava (cópia antes).
//   node --env-file-if-exists=.env.local scripts/kits-novos-fone-9.mjs [--aplicar]
import fs from "node:fs";
import { lerModulo } from "../src/server/app-rep/base.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
import { foneContato } from "../src/apps/kits-novos/domain/padroniza.js";
import { pool } from "../src/server/db.js";

const aplicar = process.argv.includes("--aplicar");
function ajuste(kit) {
  const mud = {};
  for (const k of ["c1t", "c2t", "c3t", "tel"]) { if (kit[k] == null || kit[k] === "") continue; const n = foneContato(kit[k]); if (n !== String(kit[k])) mud[k] = n; }
  const dm = kit.dm && kit.dm.tel ? foneContato(kit.dm.tel) : null;
  const dmMud = dm && dm !== String(kit.dm.tel) ? Object.assign({}, kit.dm, { tel: dm }) : null;
  if (!Object.keys(mud).length && !dmMud) return null;
  return Object.assign({}, kit, mud, dmMud ? { dm: dmMud } : {});
}
function plano(guardado) {
  const chaves = {};
  for (const [k, v] of Object.entries(guardado)) { if (!k.startsWith("r_") || !v) continue; const n = ajuste(v); if (n) chaves[k] = n; }
  return chaves;
}
const d = await lerModulo("kndados");
const p = plano(d);
const n = Object.keys(p).length;
console.log(aplicar ? "GRAVANDO" : "SIMULAÇÃO (nada gravado)", "· kits a mudar:", n);
const [k0] = Object.keys(p);
if (k0) console.log("Exemplo:", d[k0].nome, JSON.stringify({ antes: [d[k0].c1t, d[k0].tel], depois: [p[k0].c1t, p[k0].tel] }));
if (aplicar && n) {
  const copia = "scripts/kits-novos-fone-9-copia-26-11.local.json";
  fs.writeFileSync(copia, JSON.stringify(Object.fromEntries(Object.keys(p).map((k) => [k, d[k]])), null, 1));
  const v = await gravarModulo("kndados", p, "chaves", "fone-9", (guardado) => Object.assign({}, guardado, plano(guardado)));
  console.log("Gravado, versão", v, "· cópia:", copia);
}
await pool().end();
