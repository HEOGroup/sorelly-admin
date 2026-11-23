// Encomendas › Ranking (19/11/2026, Marcus): classificação das revendedoras pelo TOTAL de vendas dos últimos 3 meses (regra do Top 100, docs/setores/encomendas-e-reposicoes/regras-top100.md).
// Só leitura. Base: vendas sem brinde, troca, indicação e prêmio (tabela sorelly.venda_composicao, a mesma da média). Acertos do mesmo dia somam como um só, dia zerado não conta e o Leilão (vendedor EK) fica fora.
// Janela = de 3 meses atrás até hoje. "Posição antes" = o mesmo cálculo com a janela deslocada 1 mês para trás (quem subiu e quem caiu).
import { consulta } from "./db.js";
import { listaRevendedoras, listaAgenda, nomeNormal } from "./revendedoras.js";
import { consultarTabela } from "./devmaster2.js";
import https from "node:https";
import http from "node:http";
import tls from "node:tls";

// Conversa com o app (só GET). O Avast do Windows troca o certificado: além das autoridades padrão usamos as do sistema (a verificação continua LIGADA), igual a src/server/representantes-app.js.
let agenteApp = null;
function agenteTls() {
  if (agenteApp) return agenteApp;
  let ca; try { ca = [...tls.getCACertificates("default"), ...tls.getCACertificates("system")]; } catch (x) { ca = undefined; }
  agenteApp = new https.Agent(ca ? { ca, keepAlive: true } : { keepAlive: true });
  return agenteApp;
}
function chamarApp(_metodo, rota) {
  const base = (process.env.MOBILE_API_URL || "").trim().replace(/\/+$/, ""), chave = (process.env.MOBILE_API_KEY || "").trim();
  if (!base || !chave) return Promise.reject(new Error("MOBILE_API_URL e MOBILE_API_KEY não configurados"));
  const url = new URL(base + rota), lib = url.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    const req = lib.request(url, { method: "GET", ...(lib === https ? { agent: agenteTls() } : {}), headers: { Authorization: "Bearer " + chave, "X-App-Version": "3.5.0", Accept: "application/json" }, timeout: 20000 }, (res) => {
      const partes = [];
      res.on("data", (c) => partes.push(c));
      res.on("end", () => { let j = null; try { j = JSON.parse(Buffer.concat(partes).toString("utf8")); } catch (x) { /* resposta que não é JSON */ } resolve({ status: res.statusCode, j }); });
    });
    req.on("timeout", () => req.destroy(new Error("tempo esgotado")));
    req.on("error", (x) => reject(x));
    req.end();
  });
}

// VENDA NO APP DA REVENDEDORA (Marcus, 23/11/2026): quanto cada uma já vendeu NESTE MÊS para as clientes dela, direto do app (GET /admin/resellers/ranking, só leitura).
// O app não guarda o código da DevMaster: a ligação é pelo telefone (últimos 8 números) e, se não casar, pelo nome inteiro igual. Falha do app não derruba o ranking (a coluna fica vazia).
const soNumeros = (s) => String(s || "").replace(/[^0-9]/g, "");
const fim8 = (s) => { const n = soNumeros(s); return n.length >= 8 ? n.slice(-8) : ""; };
const chaveNome = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").split(" ").filter(Boolean).join(" ");
async function vendasDoApp(cods, nomes) {
  try {
    const lista = [];
    for (let i = 0; i < cods.length; i += 100) {
      const l = await consultarTabela("dmaam", { registros: 100, campos: ["aam_codigo", "aam_celular", "aam_whatsapp"], filtro: { aam_codigo: { in: cods.slice(i, i + 100) } } });
      l.itens.forEach((p) => lista.push(p));
    }
    const r = await chamarApp("GET", "/admin/resellers/ranking?period=month&limit=2000&order_by=total_vendido&order_dir=desc");
    const dados = r && r.j && Array.isArray(r.j.data) ? r.j.data : null;
    if (!dados) return {};
    const porFone = new Map(), porNome = new Map();
    dados.forEach((u) => { const v = Number(u.total_vendido) || 0, f = fim8(u.telefone), nm = chaveNome(u.nome); if (f && !porFone.has(f)) porFone.set(f, v); if (nm && !porNome.has(nm)) porNome.set(nm, v); });
    const out = {};
    cods.forEach((c) => {
      const p = lista.find((x) => x.aam_codigo === c) || {};
      const v = [fim8(p.aam_celular), fim8(p.aam_whatsapp)].filter(Boolean).map((f) => porFone.get(f)).find((x) => x !== undefined);
      const w = v !== undefined ? v : porNome.get(chaveNome(nomes.get(c)));
      if (w !== undefined) out[c] = Math.round(w * 100) / 100;
    });
    return out;
  } catch (x) { G.__rankAppErro = String((x && x.message) || x).slice(0, 160); return {}; }
}

const G = globalThis;
const TTL = 60 * 1000;   // tempo real: a tela pede de novo a cada minuto
const LIMITE = 200;   // quantas posições a tela mostra
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function hojeSP() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p;   // AAAA-MM-DD
}
// desloca uma data AAAA-MM-DD em n meses (dia limitado ao fim do mês)
function mesesAtras(iso, n) {
  const [a, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1 - n, 1)), ult = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(Math.min(d, ult)).padStart(2, "0");
}

async function classificar(ini, fim) {
  const r = await consulta(`select cliente, to_char(coalesce(faturada, emissao), 'YYYY-MM-DD') as dia, vendedor, (venda_dm - (brinde + troca + indicacao + premiacao + outros)) as liq, case when (venda_dm - (brinde + troca + indicacao + premiacao + outros)) > 0.005 then coalesce(acerto_dm, 0) else 0 end as ace
    from sorelly.venda_composicao where coalesce(faturada, emissao) between $1 and $2`, [ini, fim]);
  const por = new Map();
  r.rows.forEach((x) => { if (x.vendedor === "EK") return; const m = por.get(x.cliente) || por.set(x.cliente, new Map()).get(x.cliente); const a = m.get(x.dia) || [0, 0]; m.set(x.dia, [a[0] + Number(x.liq), a[1] + Number(x.ace)]); });
  const lista = [];
  por.forEach((m, cod) => {
    const dias = [...m].filter(([, v]) => v[0] > 0.005).sort().map(([d, v]) => [d, v[0], v[1]]);
    if (!dias.length) return;
    const total = dias.reduce((s, [, v]) => s + v, 0), acerto = dias.reduce((s, [, , a]) => s + a, 0);
    lista.push({ cod, total: r2(total), acerto: r2(acerto), acertos: dias.length, media: r2(total / dias.length), ultimo: dias[dias.length - 1][0], ultimoValor: r2(dias[dias.length - 1][1]) });
  });
  lista.sort((a, b) => b.total - a.total || b.ultimoValor - a.ultimoValor || (a.ultimo < b.ultimo ? 1 : -1));
  lista.forEach((x, i) => { x.pos = i + 1; });
  return lista;
}

function mesesDoAno(hoje) {
  const [a, m] = hoje.split('-').map(Number), r = [];
  for (let k = 1; k <= m; k++) { const ini = a + '-' + String(k).padStart(2, '0') + '-01', ult = new Date(Date.UTC(a, k, 0)).getUTCDate(), fim = k === m ? hoje : a + '-' + String(k).padStart(2, '0') + '-' + String(ult).padStart(2, '0'); r.push({ ym: a + '-' + String(k).padStart(2, '0'), ini, fim }); }
  return r;
}

export async function rankingGeral({ forcar = false } = {}) {
  if (!forcar && G.__sorellyRanking && Date.now() - G.__sorellyRanking.em < TTL) return G.__sorellyRanking.dados;
  const fim = hojeSP(), ini = mesesAtras(fim, 3), fimAntes = mesesAtras(fim, 1), iniAntes = mesesAtras(fim, 4);
  const mesesJanela = mesesDoAno(fim);
  const [agora, antes, base, porMes, agenda] = await Promise.all([classificar(ini, fim), classificar(iniAntes, fimAntes), listaRevendedoras(), Promise.all(mesesJanela.map((m) => classificar(m.ini, m.fim))), listaAgenda().catch(() => null)]);
  const posAntes = new Map(antes.map((x) => [x.cod, x.pos]));
  const topo = agora.slice(0, LIMITE), porCod = new Map(base.itens.map((i) => [i.cod, i]));
  const topoMes = porMes.map((l) => l.slice(0, 100)), vendaMes = porMes.map((l) => new Map(l.map((x) => [x.cod, x.total])));
  // TOP 50 PELO ACERTO (Marcus, 23/11/2026): soma do acerto dos 3 meses fechados antes do mês atual; mostra quem já acertou no mês atual e a previsão de quem falta
  const n = mesesJanela.length, tres = porMes.slice(Math.max(0, n - 4), n - 1), somaAc = new Map();
  tres.forEach((l) => l.forEach((x) => somaAc.set(x.cod, (somaAc.get(x.cod) || 0) + x.acerto)));
  const top50 = [...somaAc].sort((a, b) => b[1] - a[1]).slice(0, 50), atualMes = new Map(porMes[n - 1].map((x) => [x.cod, x]));
  const top10Ac = [...porMes[n - 1]].filter((x) => x.acerto > 0).sort((a, b) => b.acerto - a.acerto || b.total - a.total).slice(0, 10);
  const faltam = [...new Set(topo.concat(...topoMes, top50.map(([cod]) => ({ cod })), top10Ac).filter((x) => !porCod.has(x.cod)).filter((x) => !porCod.has(x.cod)).map((x) => x.cod))], nomes = new Map();
  for (let i = 0; i < faltam.length; i += 100) {   // quem não tem condicional aberto: nome direto do cadastro
    const l = await consultarTabela("dmaam", { registros: 100, campos: ["aam_codigo", "aam_nome"], filtro: { aam_codigo: { in: faltam.slice(i, i + 100) } } });
    l.itens.forEach((p) => nomes.set(p.aam_codigo, nomeNormal(p.aam_nome)));
  }
  const itens = topo.map((x) => {
    const b = porCod.get(x.cod);
    return { pos: x.pos, cod: x.cod, nome: b ? b.nome : (nomes.get(x.cod) || x.cod), rep: b ? b.representante : "", total: x.total, acerto: x.acerto, media: x.media, acertos: x.acertos, ultimo: x.ultimo, posAntes: posAntes.get(x.cod) || null, porMes: Object.fromEntries(mesesJanela.map((m, i) => [m.ym, vendaMes[i].get(x.cod) || 0])) };
  });
  const nomeDe = (cod) => { const b = porCod.get(cod); return b ? b.nome : (nomes.get(cod) || cod); };
  const meses = mesesJanela.map((m, i) => ({ ym: m.ym, ate: m.fim, fez: porMes[i].map((x) => x.cod), ac: i >= mesesJanela.length - 4 ? Object.fromEntries(porMes[i].map((x) => [x.cod, x.acerto])) : undefined, valores: i === mesesJanela.length - 1 ? Object.fromEntries(porMes[i].map((x) => [x.cod, [x.total, x.acerto]])) : undefined, itens: topoMes[i].map((x) => ({ pos: x.pos, cod: x.cod, nome: nomeDe(x.cod), rep: porCod.get(x.cod) ? porCod.get(x.cod).representante : "", venda: x.total, acerto: x.acerto })) }));
  const prev = new Map(((agenda && agenda.itens) || []).map((i) => [i.cod, i.agendaEm || i.prev]));
  const meses3 = mesesJanela.slice(Math.max(0, n - 4), n - 1).map((m) => m.ym);
  const codsApp = [...new Set(top50.map(([c]) => c).concat(top10Ac.map((x) => x.cod)))];
  const noApp = await vendasDoApp(codsApp, new Map(codsApp.map((c) => [c, nomeDe(c)])));
  const rankAcerto = { meses: meses3, mesAtual: mesesJanela[n - 1].ym, itens: top50.map(([cod, ac], i) => { const a = atualMes.get(cod), por = tres.map((l) => l.find((x) => x.cod === cod)); return { pos: i + 1, cod, vendaApp: noApp[cod] === undefined ? null : noApp[cod], rep: porCod.get(cod) ? porCod.get(cod).representante : "", mm: por.map((x) => (x ? [x.total, x.acerto] : [0, 0])), nome: nomeDe(cod), acerto: r2(ac), fezMes: !!a, acertoMes: a ? a.acerto : 0, dataMes: a ? a.ultimo : "", previsao: a ? "" : (prev.get(cod) || "") }; }) };
  // PREMIAÇÃO DO MÊS: as 10 maiores somas de acerto do mês atual (desempate pelo maior valor de venda)
  const premiacao = { ym: mesesJanela[n - 1].ym, ate: mesesJanela[n - 1].fim, itens: top10Ac.map((x, i) => ({ pos: i + 1, cod: x.cod, nome: nomeDe(x.cod), rep: porCod.get(x.cod) ? porCod.get(x.cod).representante : "", acerto: x.acerto, venda: x.total })) };
  const dados = { pronto: true, meses, rankAcerto, premiacao, appErro: Object.keys(noApp).length ? "" : (G.__rankAppErro || "sem retorno do app"), geradoEm: new Date().toISOString(), janela: { ini, fim }, janelaAntes: { ini: iniAntes, fim: fimAntes }, limite: LIMITE, corte100: agora[99] ? agora[99].total : 0, corte150: agora[149] ? agora[149].total : 0, itens };
  G.__sorellyRanking = { dados, em: Date.now() };
  return dados;
}
