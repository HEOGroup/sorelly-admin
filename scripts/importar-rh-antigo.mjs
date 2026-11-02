// Importa o RH do admin antigo para o módulo "rh" do sistema novo (pedido do Marcus, 01/11/2026: o antigo sai de uso).
// NÃO apaga nada e NÃO troca o que o RH já lançou: só ACRESCENTA o que falta (presença, advertências, horas extras, feriados, planos, motivos)
// e preenche campos VAZIOS dos colaboradores (admissão, salário, entrada, plano, efetivação, desligamento). Quem não está na lista de Pessoas entra como novo.
// Os dados vêm de scripts/rh-antigo.local.mjs (fora do Git). Sem argumento = só simula e mostra o relatório. Com --aplicar = grava (faz cópia de segurança antes).
//   node --env-file-if-exists=.env.local scripts/importar-rh-antigo.mjs [--aplicar]
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { consulta, pool } from "../src/server/db.js";
import { NOMES, COLAB, PRES_INI, PRES, ATRASOS, ADV, HE, TIPOS_HE, PCT_HE, MOTIVOS, PLANOS, FERIADOS, CARGOS, CARGA, AFAST } from "./rh-antigo.local.mjs";

const aplicar = process.argv.includes("--aplicar");
const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const slug = (t) => norm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const palavras = (n) => norm(n).split(" ").filter((w) => w.length > 2 && !["dos", "das", "del"].includes(w));
const titulo = (t) => String(t || "").toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\s(Da|De|Do|Das|Dos|E)\s/g, (m) => m.toLowerCase());
const ALIAS = { "michelle brito lima": "michele-brito-lima-cassemiro", "thalita tozzi ardnt": "thalita-torazzi-arndt", "sthefany marques de aquino correa": "sthafany-marques-de-aquino-correa" };

const atual = (await consulta("select versao, conteudo from sorelly.estado_modulo where modulo='rh'")).rows[0];
const rh = JSON.parse(JSON.stringify(atual.conteudo));
rh.colab = rh.colab || {}; rh.novos = rh.novos || []; rh.presenca = rh.presenca || {}; rh.adv = rh.adv || []; rh.horas = rh.horas || [];
const cfg = (rh.config = rh.config || {});
cfg.escalas = cfg.escalas || []; cfg.planos = cfg.planos || []; cfg.tiposAdv = cfg.tiposAdv || []; cfg.motivosAdv = cfg.motivosAdv || []; cfg.tiposHE = cfg.tiposHE || []; cfg.feriados = cfg.feriados || [];

// ---------- candidatos (quem já existe no sistema novo) ----------
const pessoasJs = fs.readFileSync("src/apps/montagem/domain/pessoas.js", "utf8").split("\n").slice(4, 45).join("\n");
const cand = new Map();
for (const m of pessoasJs.matchAll(/\["([^"\[\]]{6,})","[^"]*","(\d*)"/g)) cand.set(slug(m[1]), { id: slug(m[1]), nome: m[1], cnpj: m[2] });
try { const loc = (await import(pathToFileURL("src/apps/montagem/domain/rh-funcionarios.local.js").href)).default || []; for (const x of loc) cand.set(ALIAS[norm(x.nome)] || x.id, { id: ALIAS[norm(x.nome)] || x.id, nome: x.nome }); } catch (e) { /* sem a planilha local */ }
for (const k of Object.keys(rh.colab)) if (!cand.has(k)) cand.set(k, { id: k, nome: k.replace(/-/g, " ") });
for (const n of rh.novos) cand.set(n.id, { id: n.id, nome: n.nome });
const lista = [...cand.values()];
const acha = (nome) => {
  const nn = norm(nome); if (ALIAS[nn]) return ALIAS[nn];
  const ex = lista.find((c) => norm(c.nome) === nn); if (ex) return ex.id;
  const pa = palavras(nome); let melhor = null, mp = 0;
  for (const c of lista) { const pc = palavras(c.nome), com = pc.filter((w) => pa.includes(w)).length, sc = com / Math.max(pc.length, pa.length, 1); if (sc > mp) { mp = sc; melhor = c; } }
  return melhor && mp >= 0.6 ? melhor.id : null;
};

const nomes = {}; NOMES.split("|").forEach((x) => { const i = x.indexOf("="); nomes[+x.slice(0, i)] = x.slice(i + 1).replace(/\s+/g, " ").trim(); });
const idDe = {}; const criados = [];
const dados = {}; COLAB.split("\n").forEach((l) => { const p = l.split("|"); dados[+p[0]] = { setor: p[1], cnpj: p[2], sal: Number(p[3]), esc: p[4], ent: p[5], adm: p[6], plano: p[7], st: p[8], efet: p[9], dd: p[10], dt: p[11], dm: p[12] }; });
for (const n of Object.keys(nomes)) {
  const nome = nomes[n]; let id = acha(nome);
  if (!id) { id = "imp-" + slug(nome); criados.push(nome); if (!rh.novos.some((x) => x.id === id)) rh.novos.push({ id, nome: titulo(nome), setor: dados[n].setor, cnpj: dados[n].cnpj }); }
  idDe[n] = id;
}

// ---------- configuração: escalas, planos, tipos ----------
const escalaId = (cod) => { const dias = cod === "1" ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]; const e = cfg.escalas.find((x) => JSON.stringify([...(x.dias || [])].sort()) === JSON.stringify(dias)); if (e) return e.id; const novo = { id: "es-imp" + cod, nome: cod === "1" ? "Seg - Sex" : "Seg - Sáb", dias }; cfg.escalas.push(novo); return novo.id; };
const planoId = (txt) => { if (!txt) return ""; const [a, b] = txt.split("+").map(Number); let p = cfg.planos.find((x) => x.marco1 === a && x.marco2 === b); if (!p) { p = { id: "pl-imp" + a + "-" + b, nome: "Experiência " + a + " + " + b, marco1: a, marco2: b }; cfg.planos.push(p); } return p.id; };
for (const [a, b] of PLANOS) planoId(a + "+" + b);
const tipoAdv = (nome) => { let t = cfg.tiposAdv.find((x) => norm(x.nome) === norm(nome)); if (!t) { t = { id: "ta-imp-" + slug(nome), nome, suspensao: /suspens/i.test(nome) }; cfg.tiposAdv.push(t); } return t; };
const ALIAS_MOTIVO = { "atrasos recorrentes": "atraso" };   // o RH já usa "Atraso" para o que o antigo chamava de "Atrasos recorrentes"
const motivoAdv = (nome) => { let m = cfg.motivosAdv.find((x) => norm(x.nome) === norm(ALIAS_MOTIVO[norm(nome)] || nome)) || cfg.motivosAdv.find((x) => norm(x.nome) === norm(nome)); if (!m) { m = { id: "ma-imp-" + slug(nome), nome }; cfg.motivosAdv.push(m); } return m; };
MOTIVOS.forEach(motivoAdv);
const tipoHE = (cod) => { const nome = TIPOS_HE[cod], pct = PCT_HE[nome]; const mult = pct > 0 ? 1 + pct / 100 : 0;   // no sistema novo o tipo guarda o multiplicador (1,65 = hora extra de 65%)
  let t = cfg.tiposHE.find((x) => Math.abs(Number(x.pct) - mult) < 0.001 && (mult > 0 || /banco/i.test(x.nome))); if (!t) { t = { id: "he-imp-" + slug(nome), nome: "Hora extra " + pct + "%", pct: mult }; cfg.tiposHE.push(t); } return t; };
let nFer = 0; for (const [data, nome, cnpj] of FERIADOS) if (!cfg.feriados.some((f) => f.data === data)) { cfg.feriados.push({ id: "fr-imp-" + data, data, nome, cnpj }); nFer++; }

// ---------- colaboradores: só preenche o que está vazio ----------
const TIPO_DESLIG = { "Pedido do colaborador": "Pedido de demissão", "Fim de contrato de experiência": "Término de contrato" };
const cargos = {}; CARGOS.split("|").forEach((x) => { const i = x.indexOf("="); cargos[+x.slice(0, i)] = x.slice(i + 1); });
const carga = {}; CARGA.split("|").forEach((x) => { const [k, v] = x.split("="); carga[+k] = Number(v); });
const somaHora = (hhmm, h) => { const [a, b] = hhmm.split(":").map(Number); const t = a * 60 + b + Math.round((h + 1) * 60); return String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };   // saída = entrada + carga + 1 h de almoço
let nColab = 0;
for (const n of Object.keys(dados)) {
  const d = dados[n], id = idDe[n], o = rh.colab[id] = rh.colab[id] || {}, antes = JSON.stringify(o);
  const vazio = (v) => v === undefined || v === null || v === "" || v === 0;
  if (vazio(o.admissao) && d.adm) o.admissao = d.adm;
  if (vazio(o.salario) && d.sal) o.salario = d.sal;
  if (vazio(o.entrada) && d.ent) o.entrada = d.ent;
  if (vazio(o.escalaId)) o.escalaId = escalaId(d.esc);
  if (vazio(o.planoId) && d.plano) o.planoId = planoId(d.plano);
  if (vazio(o.efetivadoEm) && d.efet) o.efetivadoEm = d.efet;
  if (vazio(o.funcao) && cargos[n]) o.funcao = cargos[n];
  if (vazio(o.saida) && carga[n] && d.ent) o.saida = somaHora(d.ent, carga[n]);
  const semStatus = vazio(o.status) || (o.status === "ATIVO" && !o.deslig && !o.ferias && !o.afastamento);
  if (semStatus && d.st === "DESLIGADO") { o.status = "DESLIGADO"; o.deslig = { data: d.dd, tipo: TIPO_DESLIG[d.dt] || d.dt || "Outro", motivo: d.dm || "—", obs: "" }; o.desligPor = o.desligPor || "Importado do admin antigo"; o.ferias = null; o.afastamento = ""; }
  else if (semStatus && d.st === "AFASTADO") { o.status = "AFASTADO"; o.afastamento = AFAST[n] || "Afastada (informado no admin antigo)"; o.deslig = null; o.ferias = null; }
  if (o.status === "AFASTADO" && AFAST[n] && /^Afastad[oa] \(informad/.test(o.afastamento || "")) o.afastamento = AFAST[n];   // troca o texto provisório pelo motivo do antigo
  if (JSON.stringify(o) !== antes) nColab++;
}

// ---------- presença ----------
const COD = { P: "P", F: "F", J: "AJ", T: "AT", E: "FE", O: "FO", X: "AF" };
const somaDia = (iso, n) => { const d = new Date(Date.parse(iso + "T00:00:00Z") + n * 86400000); return d.toISOString().slice(0, 10); };
let pNovos = 0, pIguais = 0, pDif = 0, aNovos = 0;
for (const linha of PRES.split("\n")) {
  const [n, s] = linha.split(":"); const id = idDe[+n];
  for (let i = 0; i < s.length; i++) {
    const c = COD[s[i]]; if (!c) continue;
    const iso = somaDia(PRES_INI, i); rh.presenca[iso] = rh.presenca[iso] || {};
    const reg = rh.presenca[iso][id];
    if (!reg || !reg.c) { rh.presenca[iso][id] = Object.assign({}, reg, { c }); pNovos++; } else if (reg.c === c) pIguais++; else pDif++;
  }
}
for (const x of ATRASOS.split("|")) { const [n, iso, hh] = x.split("@"), id = idDe[+n]; rh.presenca[iso] = rh.presenca[iso] || {}; const reg = rh.presenca[iso][id] = rh.presenca[iso][id] || {}; if (!reg.atraso) { reg.atraso = hh; aNovos++; } }

// ---------- advertências (só as que faltam) ----------
const chaveAdv = (a) => [a.colabId, a.data, a.tipoId, a.motivoId].join("|");
const contaAdv = {}; rh.adv.forEach((a) => { contaAdv[chaveAdv(a)] = (contaAdv[chaveAdv(a)] || 0) + 1; });
let advNovas = 0; const vistoAdv = {};
for (const x of ADV.split("|")) {
  const [n, data, tipo, motivo, dias] = x.split("@"), t = tipoAdv(tipo), m = motivoAdv(motivo);
  const item = { id: "ad-imp-" + (advNovas + 1000 + Object.keys(vistoAdv).length), colabId: idDe[+n], data, tipoId: t.id, motivoId: m.id, dias: Number(dias) || 0, obs: "", por: "Importado do admin antigo", em: Date.parse(data + "T12:00:00Z") };
  const k = chaveAdv(item); vistoAdv[k] = (vistoAdv[k] || 0) + 1;
  if (vistoAdv[k] <= (contaAdv[k] || 0)) continue;
  rh.adv.push(item); advNovas++;
}

// ---------- horas extras (só as que faltam) ----------
const chaveHE = (h) => [h.colabId, h.data, h.tipoId, Math.round(h.horas * 100)].join("|");
const contaHE = {}; rh.horas.forEach((h) => { contaHE[chaveHE(h)] = (contaHE[chaveHE(h)] || 0) + 1; });
let heNovas = 0; const vistoHE = {}; let seq = 0;
for (const x of HE.split("|")) {
  const [n, data, cod, h] = x.split("@"), t = tipoHE(cod);
  const item = { id: "he-imp-" + (++seq), colabId: idDe[+n], data, tipoId: t.id, horas: Number(h), obs: "", por: "Importado do admin antigo", em: Date.parse(data + "T12:00:00Z") };
  const k = chaveHE(item); vistoHE[k] = (vistoHE[k] || 0) + 1;
  if (vistoHE[k] <= (contaHE[k] || 0)) continue;
  rh.horas.push(item); heNovas++;
}

console.log("RELATÓRIO (" + (aplicar ? "GRAVANDO" : "simulação") + ")");
console.log("  colaboradores: " + Object.keys(nomes).length + " no antigo | " + criados.length + " entram como novos" + (criados.length ? " (" + criados.join(", ") + ")" : "") + " | " + nColab + " com campos preenchidos");
console.log("  presença: " + pNovos + " registros novos, " + pIguais + " já iguais, " + pDif + " diferentes (vale o do RH) | atrasos novos: " + aNovos);
console.log("  advertências: +" + advNovas + " (já havia " + (rh.adv.length - advNovas) + ")");
console.log("  horas extras: +" + heNovas + " (já havia " + (rh.horas.length - heNovas) + ")");
console.log("  feriados novos: " + nFer + " | planos: " + cfg.planos.length + " | tipos de advertência: " + cfg.tiposAdv.length + " | motivos: " + cfg.motivosAdv.length + " | tipos de hora extra: " + cfg.tiposHE.length);

if (aplicar) {
  await consulta("create table if not exists sorelly.estado_modulo_bkp_rh_01_11 as select * from sorelly.estado_modulo where modulo = 'rh'");
  const chaves = { colab: rh.colab, novos: rh.novos, presenca: rh.presenca, adv: rh.adv, horas: rh.horas, config: rh.config };
  const r = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_por = atualizado_por, atualizado_em = now() where modulo = 'rh' and versao = $2 returning versao", [JSON.stringify(chaves), atual.versao]);
  console.log(r.rowCount ? "GRAVADO. Nova versão do módulo: " + r.rows[0].versao : "NÃO GRAVADO: o RH alterou o módulo durante a importação. Rode de novo.");
}
await pool().end();
