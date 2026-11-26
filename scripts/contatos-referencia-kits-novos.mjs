// Lança os contatos de referência (até 3 por revendedora) nos Kits novos (módulo kndados do servidor) a partir de um texto do Cadastro (26/11/2026).
// Formato do texto: "**N. Nome da revendedora**" e, abaixo, "- telefone — nome (relação) — OK". "OK" = o Cadastro confirmou o contato (fica verde).
// O app da representante recebe os contatos sozinho: o envio automático (app-rep/sincronizar.js) manda o kit de novo quando o contato muda.
//
// Regras (nada é apagado):
//   1. Casa pelo nome (sem acento e sem maiúscula). Vários kits com o mesmo nome: vale o de cadastro mais recente.
//   2. Kit que JÁ tem algum contato preenchido NÃO é tocado (aparece no relatório).
//   3. Nome sem kit igual fica de fora; o relatório mostra os parecidos para conferir.
//   4. Cada kit mexido ganha uma linha no histórico ("mexido no sistema": a importação da planilha não zera os contatos).
//   5. Antes de gravar, guarda a cópia dos kits no arquivo --copia. Gravação com gravarModulo (módulo travado + registro no log).
//
// Uso (na pasta do projeto; DATABASE_URL no .env.local):
//   node --env-file=.env.local scripts/contatos-referencia-kits-novos.mjs scripts/contatos-referencia-26-11.local.txt                 # só o relatório
//   node --env-file=.env.local scripts/contatos-referencia-kits-novos.mjs scripts/contatos-referencia-26-11.local.txt --pular=1 --aplicar
// O texto tem dados pessoais: arquivo .local (fora do Git).
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";

const aplicar = process.argv.includes("--aplicar");
const arquivo = process.argv.slice(2).find((a) => !a.startsWith("--"));
const pular = new Set(((process.argv.find((a) => a.startsWith("--pular=")) || "").slice(8)).split(",").filter(Boolean).map(Number));
const copia = ((process.argv.find((a) => a.startsWith("--copia=")) || "").slice(8)) || "scripts/contatos-referencia-copia.local.json";
if (!arquivo || !fs.existsSync(arquivo)) { console.error("Informe o texto dos contatos. Veja o uso no começo do arquivo."); process.exit(1); }

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// telefone só com dígitos, sem zero antes do DDD; número do exterior (+) mantém o "+"
function telefone(t) {
  const t0 = String(t || "").trim();
  if (t0.startsWith("+")) return "+" + t0.replace(/\D/g, "");
  let d = t0.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("0")) d = d.replace(/^0+/, "");
  return d;
}

// 1. lê o texto
const lista = [];
let atual = null;
for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
  const h = linha.match(/^\*\*\s*(\d+)\.\s*(.+?)\s*\*\*\s*$/);
  if (h) { atual = { n: Number(h[1]), nome: h[2].trim(), contatos: [] }; lista.push(atual); continue; }
  const c = linha.match(/^\s*-\s+(.*)$/);
  if (!c || !atual) continue;
  const partes = c[1].split(/\s+—\s+/).map((x) => x.trim()).filter(Boolean);
  const fone = telefone(partes.shift());
  const ok = partes.some((x) => /^ok$/i.test(x));
  const desc = partes.filter((x) => !/^(ok|liga[cç][aã]o|mensagem\/liga[cç][aã]o)$/i.test(x)).join(" — ");
  const m = desc.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  atual.contatos.push({ fone, nome: m ? (m[1] || m[2]) : desc, rel: m && m[1] ? m[2] : "", ok });
}

// 2. lê o servidor
const lido = (await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'kndados'")).rows[0];
if (!lido) { console.error("Módulo kndados não existe no servidor."); process.exit(1); }
const kits = Object.keys(lido.conteudo).filter((k) => k.startsWith("r_")).map((k) => ({ chave: k, k: lido.conteudo[k] })).filter((x) => x.k && x.k.id && !x.k.excluido);
const chaveNome = (s) => norm(s).split(" ").filter((p) => !["de", "da", "do", "das", "dos", "e"].includes(p)).join(" ");   // "Fernanda de Oliveira" = "Fernanda Oliveira"
const porNome = new Map();
kits.forEach((x) => { const n = chaveNome(x.k.nome); if (!porNome.has(n)) porNome.set(n, []); porNome.get(n).push(x); });
const temContato = (k) => [1, 2, 3].some((n) => k["c" + n + "n"] || k["c" + n + "t"]);
const histN = (k) => (Array.isArray(k && k.hist) ? k.hist.length : 0);
const pri = (s) => (s || "").slice(0, 1) + (s || "").split(" ").slice(-1)[0];
const parecidos = (nome) => { const p = norm(nome).split(" "); return kits.filter((x) => { const q = norm(x.k.nome).split(" "); return q[0] === p[0] && q[q.length - 1] === p[p.length - 1]; }); };

// telefone repetido em mais de uma revendedora (pode ser cópia errada)
const donos = new Map();
lista.forEach((r) => r.contatos.forEach((c) => { if (!c.fone) return; if (!donos.has(c.fone)) donos.set(c.fone, new Set()); donos.get(c.fone).add(r.n); }));
const repetidos = [...new Set([...donos.values()].filter((s) => s.size > 1).map((s) => [...s].sort((a, b) => a - b).join(" e ")))];

const R = { grava: [], jaTem: [], semKit: [], pulados: [], variosKits: [], poucos: [], estranhos: [] };
const chaves = {}, antes = {};
for (const r of lista) {
  if (pular.has(r.n)) { R.pulados.push(r.n + " " + r.nome); continue; }
  const cand = (porNome.get(chaveNome(r.nome)) || []).slice().sort((a, b) => String(b.k.cad || "").localeCompare(String(a.k.cad || "")));
  if (!cand.length) { R.semKit.push(r.n + " " + r.nome + (parecidos(r.nome).length ? " → parecido: " + parecidos(r.nome).map((x) => x.k.nome + " (" + x.k.id + ", " + x.k.st + ", " + x.k.cad + ")").join("; ") : "")); continue; }
  if (cand.length > 1) R.variosKits.push(r.n + " " + r.nome + ": " + cand.map((x) => x.k.id + " " + x.k.st + " " + x.k.cad).join(" | ") + " → usa " + cand[0].k.id);
  const alvo = cand[0];
  if (temContato(alvo.k)) { R.jaTem.push(r.n + " " + r.nome + " (" + alvo.k.id + ")"); continue; }
  const cs = r.contatos.slice(0, 3);
  if (cs.length < 3) R.poucos.push(r.n + " " + r.nome + ": " + cs.length + " contato(s)");
  cs.forEach((c, i) => { if (c.fone.replace(/\D/g, "").length < 10 || c.fone.replace(/\D/g, "").length > 11 && !c.fone.startsWith("+")) R.estranhos.push(r.n + " " + r.nome + ", contato " + (i + 1) + ": telefone com " + c.fone.replace(/\D/g, "").length + " dígitos"); });
  const novo = Object.assign({}, alvo.k);
  cs.forEach((c, i) => { const n = i + 1; novo["c" + n + "n"] = c.nome; novo["c" + n + "t"] = c.fone; novo["c" + n + "r"] = c.rel; novo["c" + n] = !!c.ok; });
  novo.hist = (alvo.k.hist || []).concat([{ em: Date.now(), quem: "Cadastro", txt: "Contatos de referência lançados (" + cs.length + ", " + cs.filter((c) => c.ok).length + " confirmados)" }]);
  chaves[alvo.chave] = novo; antes[alvo.chave] = alvo.k; R.grava.push(r.n + " " + r.nome + " → " + alvo.k.id + " (" + alvo.k.st + ", " + (alvo.k.rep || "sem representante") + ")");
}

console.log("Texto: " + lista.length + " revendedoras | servidor: " + kits.length + " kits (versão " + lido.versao + ")");
console.log("Telefone repetido em mais de uma revendedora: " + (repetidos.length ? repetidos.join("; ") : "nenhum"));
console.log("Pulados por pedido: " + R.pulados.length + (R.pulados.length ? " → " + R.pulados.join("; ") : ""));
console.log("Vão ser gravados: " + R.grava.length); R.grava.forEach((x) => console.log("   " + x));
console.log("Mais de um kit com o mesmo nome (vale o mais recente): " + R.variosKits.length); R.variosKits.forEach((x) => console.log("   " + x));
console.log("Kit que já tinha contato (não tocado): " + R.jaTem.length); R.jaTem.forEach((x) => console.log("   " + x));
console.log("Sem kit com esse nome: " + R.semKit.length); R.semKit.forEach((x) => console.log("   " + x));
console.log("Menos de 3 contatos: " + R.poucos.length); R.poucos.forEach((x) => console.log("   " + x));
console.log("Telefone com tamanho estranho (gravado como veio): " + R.estranhos.length); R.estranhos.forEach((x) => console.log("   " + x));

if (!aplicar) { console.log("\nSIMULAÇÃO: nada foi gravado. Para gravar, rode de novo com --aplicar."); await pool().end(); process.exit(0); }
if (!Object.keys(chaves).length) { console.log("\nNada para gravar."); await pool().end(); process.exit(0); }

fs.writeFileSync(copia, JSON.stringify({ versaoAntes: lido.versao, em: new Date().toISOString(), kits: antes }, null, 1));
console.log("\nCópia dos " + Object.keys(antes).length + " kits antes da gravação: " + copia);
let pulos = 0;
const versao = await gravarModulo("kndados", chaves, "chaves", "contatos de referência 26/11/2026", (guardado, novo) => {
  Object.keys(chaves).forEach((k) => {
    const g = guardado[k];
    if (g && (histN(g) !== histN(antes[k]) || temContato(g))) { novo[k] = g; pulos++; }
  });
  return novo;
});
console.log("GRAVADO: versão " + versao + " do módulo kndados." + (pulos ? " " + pulos + " kit(s) mexido(s) por outra pessoa durante a gravação ficaram como estavam." : ""));
await pool().end();
