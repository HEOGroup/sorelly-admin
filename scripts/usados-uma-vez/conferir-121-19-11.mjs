// SÓ LEITURA: a lista de 121 peças que a equipe disse ter subido hoje: quantas têm foto de verdade na DevMaster
import { todasAsPaginas } from "../../src/server/devmaster2.js";
const txt = `BT0121 BT0132 P1299 P1314 P1386 P1557 P2007 P2009 P2146 P2167 P2308 P2309 P2310 P2311 P2312 P2313 P2314 P2315 P2316 P2318 P2319 P2320 P2321 P2322 P2323 P2324 P2325 P2326 P2327 P2328
B3460 B5127 B5144 B5259 B5263 B5266 B5267 B5269 B5270 B5271 B5272 B5273 B5274 B5275 B5276 B5277 B5279 B5280 B5281 B5282 B5283 B5284 B5288 BB1537 BB1538 BB1539 BB1540 BB1541 BL0045 BL0046 BL0047
A1205 A1331 A1357 A2178 A2230 A2307 A2312 A2332 A2340 A2399 A2400 A2401 A2402 A2403 A2404 A2405 A2406
CC0340 CC0417 CC0421 CC0423 CC0428 CC0429 CC0430 CC0431 CC0432 CC0433 COL0028 COL0162 COL0166 COL0167 COL0168
CK0130 CK0634 CK0635 CL0801 CL0802 CL1858 CL1972 CL2484 CL2500 CL2581 CL2786 CL2800 CL2801 CL2803
SP0067 SP0108 SP0113 SP0130 SP0233 SP0321
I0730 I0766 I0767 I0768 I0769
T0341 T0343
M0934`;
const cods = txt.split(/\s+/).filter(Boolean);
const ok = [], sem = [], naoAchou = [];
for (let i = 0; i < cods.length; i += 40) {
  const lote = cods.slice(i, i + 40);
  const r = await todasAsPaginas("dmaaa", { filtro: { aaa_codigo: { in: lote } }, campos: ["aaa_codigo", "aaa_foto", "aaa_datacadastro"] }, 5);
  const m = {}; r.forEach(x => { m[String(x.aaa_codigo).trim().toUpperCase()] = x; });
  lote.forEach(c => { const x = m[c]; if (!x) naoAchou.push(c); else if (String(x.aaa_foto || "").trim()) ok.push(c); else sem.push(c + "(" + String(x.aaa_datacadastro).slice(5, 10) + ")"); });
}
console.log("LISTA", cods.length, "| com foto na DevMaster", ok.length, "| SEM foto na DevMaster", sem.length, "| não achados", naoAchou.length);
console.log("SEM", sem.join(" ")); console.log("NAO", naoAchou.join(" "));
