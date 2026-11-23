// Testa a divisão por casa do Financeiro familiar (Marcus, 22/11/2026): Casa Praia e Casa Jardine = Anamaria e Marco Antonio (50% cada); Casa Alphaville = os 4 sócios (25% cada); Família = os 4 (25%).
// DADOS DE MENTIRA, nenhum banco. O domínio usa o atalho "@/", que o Node não conhece: o teste copia o arquivo para a pasta temporária trocando só essa linha. Rodar: node scripts/testar-divisao-casas.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const fonte = fs.readFileSync(new URL("../src/apps/montagem/domain/financeiro-familiar.js", import.meta.url), "utf8").replace('import { globLocal } from "@/lib/glob-local";', "var globLocal = function(){ return {}; };");
const tmp = path.join(os.tmpdir(), "ff-dominio-teste-" + process.pid + ".mjs");
fs.writeFileSync(tmp, fonte);
const D = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

let ok = 0, falhou = 0;
const confere = (nome, cond, extra) => { if (cond) { ok++; console.log("  ok  " + nome); } else { falhou++; console.log("FALHOU  " + nome + (extra ? "  → " + extra : "")); } };
const pessoas = ["marcus", "anamaria", "marco", "anabeatriz", "lucas", "familia", "juan", "casajardine", "casaalphaville"].map((id) => ({ id, nome: id, tipo: "SOCIO", ativo: true, cor: "#fff" }));
const novoFf = () => ({ personas: JSON.parse(JSON.stringify(pessoas)), contas: [], parcelas: {}, hist: [], liberados: [], fechamentos: {}, transf: [], contasBanc: [], categorias: [{ chave: "CASA", nome: "Casa" }], pix: [], pixMeta: {}, repasses: [], prest: [], dividas: [], faturas: {}, prolabore: {} });
const roda = (ff, a) => { const r = D.ffReduz({ ff }, Object.assign({ type: "FF", por: "teste" }, a)); return r.patch.ff || ff; };
const ym = D.hojeYm();

console.log("1. Para quem entra → quem divide");
const ff0 = novoFf();
const dPraia = D.destinoConta ? D.destinoConta(ff0, "juan") : null;
console.log("  (destinoConta " + (D.destinoConta ? "exportada" : "não exportada, testo pelo reducer") + ")");

console.log("2. Lançar conta em cada casa");
let ff = novoFf();
ff = roda(ff, { op: "conta_add", personaId: "juan", descricao: "Condomínio Praia", categoria: "CASA", dia: 10, forma: "PIX", recorrencia: "unica", mesInicio: ym, valor: 1000 });
ff = roda(ff, { op: "conta_add", personaId: "casajardine", descricao: "IPTU Jardine", categoria: "CASA", dia: 10, forma: "PIX", recorrencia: "unica", mesInicio: ym, valor: 600 });
ff = roda(ff, { op: "conta_add", personaId: "casaalphaville", descricao: "Aluguel Alphaville", categoria: "CASA", dia: 10, forma: "PIX", recorrencia: "unica", mesInicio: ym, valor: 4000 });
ff = roda(ff, { op: "conta_add", personaId: "__familia4", descricao: "Mercado", categoria: "CASA", dia: 10, forma: "PIX", recorrencia: "unica", mesInicio: ym, valor: 800 });
ff = roda(ff, { op: "conta_add", personaId: "marcus", descricao: "Barbeiro", categoria: "CASA", dia: 10, forma: "PIX", recorrencia: "unica", mesInicio: ym, valor: 100 });
const c = (d) => ff.contas.find((x) => x.descricao === d);
confere("Casa Praia fica na casa e divide entre Anamaria e Marco", c("Condomínio Praia") && c("Condomínio Praia").personaId === "juan" && JSON.stringify(c("Condomínio Praia").rateio) === JSON.stringify(["anamaria", "marco"]), JSON.stringify(c("Condomínio Praia")));
confere("Casa Jardine divide entre Anamaria e Marco", JSON.stringify(c("IPTU Jardine").rateio) === JSON.stringify(["anamaria", "marco"]));
confere("Casa Alphaville divide entre os 4 sócios", c("Aluguel Alphaville").rateio.length === 4 && ["marcus", "anamaria", "marco", "anabeatriz"].every((id) => c("Aluguel Alphaville").rateio.includes(id)), JSON.stringify(c("Aluguel Alphaville").rateio));
confere("Lucas não entra em nenhuma casa", ![c("Condomínio Praia"), c("IPTU Jardine"), c("Aluguel Alphaville")].some((x) => x.rateio.includes("lucas")));
confere("Família continua ÷4 na Casa/Família", c("Mercado").personaId === "familia" && c("Mercado").rateio.length === 4);
confere("Conta de pessoa não tem divisão", c("Barbeiro").personaId === "marcus" && !c("Barbeiro").rateio);

console.log("3. Parte de cada pessoa no mês");
const parte = (pid) => D.totaisPersona(ff, pid, ym).contas.total;
confere("Anamaria: 500 (Praia) + 300 (Jardine) + 1.000 (Alphaville) + 200 (Família) = 2.000", Math.abs(parte("anamaria") - 2000) < 0.01, String(parte("anamaria")));
confere("Marco: 2.000 igual à Anamaria", Math.abs(parte("marco") - 2000) < 0.01, String(parte("marco")));
confere("Marcus: 1.000 (Alphaville) + 200 (Família) + 100 (sozinho) = 1.300", Math.abs(parte("marcus") - 1300) < 0.01, String(parte("marcus")));
confere("Ana Beatriz: 1.000 + 200 = 1.200", Math.abs(parte("anabeatriz") - 1200) < 0.01, String(parte("anabeatriz")));
confere("Lucas: 0", Math.abs(parte("lucas")) < 0.01, String(parte("lucas")));
confere("A soma das partes fecha com o total lançado (6.500)", Math.abs(["marcus", "anamaria", "marco", "anabeatriz", "lucas"].reduce((t, id) => t + parte(id), 0) - 6500) < 0.01);

console.log("4. Trocar a conta de casa");
ff = roda(ff, { op: "conta_set", id: c("Barbeiro").id, patch: { personaId: "juan" } });
confere("Conta de pessoa passa para a Casa Praia e ganha a divisão", c("Barbeiro").personaId === "juan" && JSON.stringify(c("Barbeiro").rateio) === JSON.stringify(["anamaria", "marco"]));
ff = roda(ff, { op: "conta_set", id: c("Barbeiro").id, patch: { personaId: "marcus" } });
confere("Voltar para a pessoa tira a divisão", c("Barbeiro").personaId === "marcus" && !c("Barbeiro").rateio);
confere("paraQuemDe: casa aparece como casa, Família como Família", D.paraQuemDe(c("Condomínio Praia")) === "juan" && D.paraQuemDe(c("Mercado")) === "__familia4" && D.paraQuemDe(c("Barbeiro")) === "marcus");

console.log("5. Conta antiga que já está numa casa, sem divisão guardada");
c("Aluguel Alphaville").rateio = null; c("Condomínio Praia").rateio = null;
confere("Alphaville antiga sem divisão: cada sócio paga 1.000 (e Lucas 0)", Math.abs(parte("marcus") - 1300) < 0.01 && Math.abs(parte("lucas")) < 0.01, String(parte("marcus")));
confere("Praia antiga sem divisão: Anamaria 500 e Marco 500", Math.abs(parte("anamaria") - 2000) < 0.01 && Math.abs(parte("marco") - 2000) < 0.01);
confere("paraQuemDe da conta antiga continua sendo a casa", D.paraQuemDe(c("Aluguel Alphaville")) === "casaalphaville");

console.log(falhou ? "\n" + falhou + " FALHOU, " + ok + " ok" : "\nTUDO OK (" + ok + " verificações)");
void dPraia;
process.exit(falhou ? 1 : 0);
