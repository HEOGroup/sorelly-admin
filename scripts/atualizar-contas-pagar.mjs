// Atualiza as contas a pagar (títulos em aberto) direto da DevMaster API 2 (só leitura). Rode: node scripts/atualizar-contas-pagar.mjs
// Lê a tabela dmabe (Contas a Pagar, situação A e P com saldo), o nome do fornecedor (dmaat) e o nome da natureza (dmaan).
// Grava SÓ as listas "apagar" de dois arquivos locais (fora do GitHub): contas-empresa.local.js (vence até 31/10/2026) e contas-empresa-meses.local.js (de 01/11/2026 em diante).
// Filial/CNPJ: se o título já existia nos arquivos, mantém o CNPJ que o Marcus conferiu; senão traduz a filial da DevMaster (01=34, 02=46, 03=59, 04=por fora, 05=67).
// Item: [filial, natureza, nomeNatureza, prefixo, número, parcela, fornecedorCod, título, emissão, vencimento, valor, saldo, diasAtraso].
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const l of fs.readFileSync(path.join(raiz, ".env.local"), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const dm = await import(pathToFileURL(path.join(raiz, "src/server/devmaster2.js")).href);

const dir = path.join(raiz, "src/apps/montagem/domain");
const F_OUT = path.join(dir, "contas-empresa.local.js"), F_FUT = path.join(dir, "contas-empresa-meses.local.js");
const CORTE = "2026-10-31", FILIAL = { "01": "34", "02": "46", "03": "59", "04": "fora", "05": "67" };
const r2 = (n) => Math.round(n * 100) / 100;
const ler = (f) => { const t = fs.readFileSync(f, "utf8"); const i = t.indexOf("export default"); return { cab: t.slice(0, i), obj: JSON.parse(t.slice(i + 14).replace(/;?\s*$/, "")) }; };

async function tudo(codigo, opcoes) {
  let todos = [];
  for (let p = 0; p < 80; p++) { const r = await dm.consultarTabela(codigo, { registros: 500, pagina: p, ...opcoes }); const it = r.itens || []; todos = todos.concat(it); if (it.length < 500) break; }
  return todos;
}

const out = ler(F_OUT), fut = ler(F_FUT);
const conhecido = new Map(); out.obj.apagar.concat(fut.obj.apagar).forEach((a) => conhecido.set([a[3], a[4], a[5], a[6]].join("|"), a[0]));

let abertos = [];
for (const sit of ["A", "P"]) abertos = abertos.concat(await tudo("dmabe", { filtro: { abe_situacao: sit }, campos: ["abe_prefixo", "abe_numero", "abe_parcela", "abe_fornecedor", "abe_emissao", "abe_vencimento", "abe_valor", "abe_saldo", "abe_natureza", "abe_filialorigem"] }));
abertos = abertos.filter((x) => x.abe_saldo > 0.004);

const forn = new Map((await tudo("dmaat", { campos: ["aat_codigo", "aat_nome"] })).map((f) => [f.aat_codigo, String(f.aat_nome || "").trim()]));
const nat = new Map((await tudo("dmaan", { campos: ["aan_codigo", "aan_descricao"] })).map((n) => [n.aan_codigo, String(n.aan_descricao || "").trim()]));

const hoje = new Date().toISOString().slice(0, 10);
const dias = (v) => Math.max(0, Math.round((new Date(hoje + "T12:00:00") - new Date(v + "T12:00:00")) / 864e5));
let novos = 0;
const itens = abertos.map((x) => {
  const k = [x.abe_prefixo, x.abe_numero, x.abe_parcela, x.abe_fornecedor].join("|"), venc = x.abe_vencimento.slice(0, 10);
  let fil = conhecido.get(k); if (!fil) { fil = FILIAL[x.abe_filialorigem] || "fora"; novos++; }
  return [fil, x.abe_natureza, nat.get(x.abe_natureza) || "", x.abe_prefixo, x.abe_numero, x.abe_parcela, x.abe_fornecedor, forn.get(x.abe_fornecedor) || "", x.abe_emissao.slice(0, 10), venc, r2(x.abe_valor), r2(x.abe_saldo), dias(venc)];
}).sort((a, b) => (a[9] < b[9] ? -1 : a[9] > b[9] ? 1 : 0));

out.obj.apagar = itens.filter((a) => a[9] <= CORTE); out.obj.geradoEm = hoje;
fut.obj.apagar = itens.filter((a) => a[9] > CORTE); fut.obj.geradoEm = hoje;
const nota = (c, t) => c.replace(/\n\/\/ Atualizado pela DevMaster[^\n]*/g, "").replace(/\s*$/, "\n") + "// Atualizado pela DevMaster em " + hoje + " (" + t + " títulos em aberto, node scripts/atualizar-contas-pagar.mjs).\n";
fs.writeFileSync(F_OUT, nota(out.cab, out.obj.apagar.length) + "export default " + JSON.stringify(out.obj) + ";\n");
fs.writeFileSync(F_FUT, nota(fut.cab, fut.obj.apagar.length) + "export default " + JSON.stringify(fut.obj) + ";\n");

const soma = (l) => r2(l.reduce((s, a) => s + a[11], 0));
console.log("em aberto na DevMaster:", itens.length, "títulos | novos (CNPJ pela filial):", novos);
console.log("vence até " + CORTE + ":", out.obj.apagar.length, "títulos, R$", soma(out.obj.apagar));
console.log("de 01/11 em diante:", fut.obj.apagar.length, "títulos, R$", soma(fut.obj.apagar));
const mes = {}; itens.forEach((a) => { const m = a[9].slice(0, 7); mes[m] = r2((mes[m] || 0) + a[11]); });
console.log(JSON.stringify(Object.entries(mes).filter(([m]) => m >= "2026-10").sort().slice(0, 6)));
