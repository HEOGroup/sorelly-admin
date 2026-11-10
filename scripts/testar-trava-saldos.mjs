// Teste da trava dos saldos (10/11/2026). Roda a função de verdade, sem servidor e sem banco. Uso: node scripts/testar-trava-saldos.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { protegerSaldos } = await jiti.import("@/server/trava-saldos");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if (cond) { ok++; console.log("  OK   " + nome); } else { falha++; console.log("  FALHA " + nome + (extra ? " -> " + extra : "")); } };
const guardado = () => ({ blocos: [{ id: "34" }], contas: [{ id: "a" }, { id: "b" }], saldos: { "2026-09-30": { a: 10, b: 20 }, "2026-10-28": { a: 11, b: 21 } }, fechamentos: { "2026-10-28": { 34: true } }, aportes: { "2026-10-28": [{ v: 1 }] }, ajustes: { "2026-10": [{ id: 1, valor: 5 }] } });

// 1) o caso da sexta: tela manda o modelo vazio
let novo = { blocos: [{ id: "34" }], contas: [{ id: "a" }], saldos: {}, fechamentos: {}, aportes: {}, ajustes: {} };
let n = protegerSaldos(guardado(), novo);
t("modelo vazio não apaga: dias de volta", Object.keys(novo.saldos).length === 2 && n === 5, JSON.stringify(n));
t("fechamentos, aportes e ajustes de volta", !!novo.fechamentos["2026-10-28"] && !!novo.aportes["2026-10-28"] && !!novo.ajustes["2026-10"]);
t("a lista de contas da tela é respeitada", novo.contas.length === 1);

// 2) tela que nem traz as chaves
novo = { contas: [] };
protegerSaldos(guardado(), novo);
t("sem a chave saldos também devolve", Object.keys(novo.saldos).length === 2);

// 3) editar um dia que a tela traz vale
novo = guardado(); novo.saldos["2026-10-28"] = { a: 999 };
n = protegerSaldos(guardado(), novo);
t("editar o dia vale", novo.saldos["2026-10-28"].a === 999 && n === 0);
t("tirar uma conta de um dia vale", (() => { const x = guardado(); x.saldos["2026-10-28"] = { a: 11 }; protegerSaldos(guardado(), x); return x.saldos["2026-10-28"].b === undefined; })());

// 4) dia novo entra
novo = guardado(); novo.saldos["2026-11-10"] = { a: 5 };
protegerSaldos(guardado(), novo);
t("dia novo entra e os antigos ficam", Object.keys(novo.saldos).length === 3);

// 5) excluir dia de propósito = dia vazio
novo = guardado(); novo.saldos["2026-10-28"] = {};
n = protegerSaldos(guardado(), novo);
t("dia excluído de propósito (vazio) vale", Object.keys(novo.saldos["2026-10-28"]).length === 0 && n === 0);

// 6) tela antiga que apaga a chave do dia: o servidor devolve
novo = guardado(); delete novo.saldos["2026-10-28"];
protegerSaldos(guardado(), novo);
t("tela antiga que apaga a chave não consegue", !!novo.saldos["2026-10-28"] && novo.saldos["2026-10-28"].a === 11);

// 7) nada guardado ainda / entrada estranha
t("nada guardado: não mexe", protegerSaldos(undefined, { saldos: {} }) === 0 && protegerSaldos(guardado(), null) === 0);
novo = { saldos: [] }; protegerSaldos(guardado(), novo);
t("chave com formato errado vira objeto e recebe os dias", !Array.isArray(novo.saldos) && Object.keys(novo.saldos).length === 2);

console.log(falha ? "\n" + falha + " FALHA(S)" : "\nTUDO OK (" + ok + ")");
process.exit(falha ? 1 : 0);
