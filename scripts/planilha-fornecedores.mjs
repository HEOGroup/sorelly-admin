// Lê a planilha "Pag Fornecedores Nova 2026" (aba RESUMO MÊS, último mês) e grava src/apps/montagem/domain/pf-mes.local.js (arquivo local, fora do GitHub).
// Uso: node scripts/planilha-fornecedores.mjs "C:\caminho\Pag Fornecedores Nova 2026.xlsx"
// Grava, por fornecedor: A PAGAR, PAGO, SALDO (o que falta para fechar o mês) e a data limite; e a média do desconto do cartão da Pontual (aba "Pontual - Negociações").
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arq = process.argv[2];
if(!arq){ console.error("Passe o caminho do .xlsx"); process.exit(1); }
const dir = mkdtempSync(join(tmpdir(), "planilha-"));
execFileSync(process.platform === "win32" ? join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar", ["-xf", arq, "-C", dir]);   // no Windows usa o tar do sistema (aceita zip)
const ler = (p) => readFileSync(join(dir, p), "utf8");
const dec = (t) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#10;/g, " ");
const strs = (ler("xl/sharedStrings.xml").match(/<si>[\s\S]*?<\/si>/g) || []).map((si) => dec((si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join("")));
const wb = ler("xl/workbook.xml"), rels = ler("xl/_rels/workbook.xml.rels");
const abas = [...wb.matchAll(/<sheet [^>]*name="([^"]*)"[^>]*r:id="([^"]*)"/g)].map((m) => ({ nome: dec(m[1]), id: m[2] }));
const arquivoDe = (id) => "xl/" + rels.match(new RegExp('Id="' + id + '"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Id="' + id + '"')).slice(1).find(Boolean);
function lerAba(prefixo){
  const aba = abas.find((a) => a.nome.trim().toUpperCase().startsWith(prefixo.toUpperCase()));
  if(!aba) throw new Error("Aba não encontrada: " + prefixo);
  const x = ler(arquivoDe(aba.id)), linhas = {};
  for(const r of x.match(/<row [^>]*>[\s\S]*?<\/row>/g) || []){
    const n = +r.match(/ r="(\d+)"/)[1], o = {};
    for(const c of r.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []){
      const ref = c.match(/ r="([A-Z]+)\d+"/)[1], t = (c.match(/ t="(\w+)"/) || [])[1], v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      if(v === undefined) continue; o[ref] = t === "s" ? strs[+v] : v;
    }
    if(Object.keys(o).length) linhas[n] = o;
  }
  return linhas;
}
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : Math.round(n * 100) / 100; };
const iso = (serial) => new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10);

// ── RESUMO MÊS: último bloco "FORNECEDOR | A PAGAR | PAGO | SALDO"
const res = lerAba("RESUMO M");
const ns = Object.keys(res).map(Number).sort((a, b) => a - b);
const cab = ns.filter((n) => String(res[n].A || "").trim() === "FORNECEDOR" && String(res[n].B || "").trim() === "A PAGAR");
const ini = cab[cab.length - 1], itens = [];
const SOCIO = /^(MARCUS|ANAMARIA|MARCO ANTONIO|ANA BEATRIZ|LUCAS|CASA)\s*$/i;
for(const n of ns.filter((k) => k > ini)){
  const o = res[n], nome = String(o.A || "").trim();
  if(/^TOTAL/i.test(nome)){ if(/TOTAL MENSAL GERAL/i.test(nome)) break; continue; }
  if(!nome) continue;
  const b = num(o.B), c = num(o.C), d = num(o.D);
  if(b === null && d === null) continue;
  const saldo = d !== null ? d : Math.round(((b || 0) - (c || 0)) * 100) / 100;
  const e = o.E, serial = e !== undefined && !isNaN(+e) ? +e : null;
  itens.push({ nome, tipo: SOCIO.test(nome) ? "socio" : "fornecedor", aPagar: b || 0, pago: c || 0, saldo, ate: serial ? iso(serial) : null, obs: serial ? "" : String(e || ""), confere: b === null || c === null || Math.abs((b - c) - saldo) < 0.5 });
}
const datas = itens.map((i) => i.ate).filter(Boolean).sort();
const mes = datas.length ? datas[Math.floor(datas.length / 2)].slice(0, 7) : "";

// ── desconto do cartão da Pontual: aba "Pontual - Negociações" (mês, valor total, juros)
let descontos = [];
try {
  const pn = lerAba("Pontual - Neg");
  const MESES = ["janeiro", "fevereiro", "março", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  for(const n of Object.keys(pn).map(Number).sort((a, b) => a - b)){
    if(n < 4 || n > 20) continue;
    const o = pn[n], m = String(o.A || "").trim().toLowerCase(), b = num(o.B), c = num(o.C);
    if(MESES.includes(m) && b && c !== null && c > 0) descontos.push({ mes: m, total: b, desconto: c, pct: Math.round((c / b) * 10000) / 100 });
  }
} catch(err){ console.warn("Sem desconto do cartão:", err.message); }
const ult = descontos.slice(-3), media = ult.length ? Math.round((ult.reduce((t, x) => t + x.pct, 0) / ult.length) * 100) / 100 : 10;

const saida = { geradoEm: new Date().toISOString().slice(0, 10), mes, itens, cartao: { descontos, mediaUltimos3: media } };
writeFileSync(new URL("../src/apps/montagem/domain/pf-mes.local.js", import.meta.url),
  "// DADOS REAIS (só neste computador, fora do GitHub): saldo de cada fornecedor no mês, lido da planilha Pag Fornecedores (RESUMO MÊS). Gerado por scripts/planilha-fornecedores.mjs\nexport default " + JSON.stringify(saida) + ";\n");
rmSync(dir, { recursive: true, force: true });
console.log("mês", mes, "| linhas", itens.length, "| fornecedores com saldo", itens.filter((i) => i.tipo === "fornecedor" && i.saldo > 0.005).length, "| desconto cartão (média 3 últimos)", media + "%");
