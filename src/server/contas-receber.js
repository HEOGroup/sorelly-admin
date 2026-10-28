// Contas a receber das revendedoras (Marcus, 27/10/2026), lido da DevMaster API 2 (SÓ LEITURA).
//   dmabg = títulos a receber (cliente, forma de pagamento, valor, saldo, vencimento, vendedor)   dmacd = nome de cada forma de pagamento
//   dmaao = vendedores   dmaam = clientes (nome e grupo, para separar as funcionárias)
// Regra do Marcus: venda lançada com a forma "Acerto - loja" (ACE) ou "Acerto - loja interno" (ACI) = a revendedora NÃO pagou, mesmo que pague depois.
// "Recebido nas contas" = tudo o que NÃO é acerto - loja (Pix, link, cartão, dinheiro). Cada conta = a forma de pagamento (ex.: Pix Sicredi Shopping 46).
// A leitura é pesada (milhares de títulos por mês): roda em SEGUNDO PLANO, guarda o resultado no banco e a tela pergunta de novo até ficar pronto.
// Funcionárias: o grupo do CADASTRO do cliente na DevMaster (dmaam.aam_grupo = "0002" FUNCIONÁRIOS, tabela dmalv). Revendedora negativada ou que sumiu com o kit continua revendedora.
import { todasAsPaginas } from "./devmaster2.js";
import { consulta } from "./db.js";

const G = globalThis;
const TTL = 30 * 60 * 1000;
const estado = () => (G.__sorellyCR = G.__sorellyCR || { rodando: false, etapa: "", pct: 0, erro: "", dados: null, em: 0 });
const GRUPOS = ["Pix", "Link", "Cartão", "Dinheiro", "Outros", "Acerto loja"];

function mesAtualBR() { return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", month: "2-digit" }).format(new Date())); }
function anoAtualBR() { return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date())); }
const tc = (s) => String(s || "").toLowerCase().replace(/(^|\s)\S/g, (a) => a.toUpperCase());
const dois = (s) => tc(s).replace(/\s+/g, " ").replace(/\s+\d{3,}$/, "").trim();   // nome inteiro do vendedor, sem o código no fim (Marcus, 27/10/2026: nada abreviado nas telas)
const r0 = (v) => Math.round(v);

function grupo(desc) {
  const d = String(desc || "").toUpperCase();
  return /^ACERTO/.test(d) ? "Acerto loja" : /^PIX/.test(d) ? "Pix" : /^LINK/.test(d) ? "Link" : /^(CR|D)[ÉE]DITO|^D[ÉE]BITO/.test(d) ? "Cartão" : /DINHEIRO/.test(d) ? "Dinheiro" : "Outros";
}
// Titular da conta: pelo nome da conta (suposição do Marcus a confirmar, 27/10/2026)
function titular(nome) {
  const n = String(nome || "").toUpperCase();
  if (/AXIS/.test(n)) return "Axis";
  if (/H&O/.test(n)) return "H&O";
  if (/ PF|ANAMARIA|MARCO|LUCAS|MARCUS/.test(n)) return "Família e sócios";
  if (/GETNET|CIELO/.test(n) && / P$/.test(n)) return "Maquininhas P";
  if (/DINHEIRO|BANHO|POINT|REPRESENTANTES|PRESTADORES|DEVMASTER|INDICA|CARREGAR|ESTORNO|^$/.test(n)) return "Caixas internos";
  if (/OFFICE|ACRILICOS|LINDA|MADEIRA|CHARME|TUCANO|ELLO|MEGA SUL/.test(n)) return "Pix a fornecedor";
  if (/34\b/.test(n)) return "CNPJ 34";
  if (/46\b/.test(n)) return "CNPJ 46";
  if (/59\b|SERENITY/.test(n)) return "CNPJ 59";
  return "Outros";
}


// Formas de pagamento, vendedores e funcionárias: lidos uma vez por hora e usados pelo resumo e pela lista de pagamentos.
async function base() {
  if (G.__sorellyCRBase2 && Date.now() - G.__sorellyCRBase2.em < 60 * 60 * 1000) return G.__sorellyCRBase2;
  const formas = {}; (await todasAsPaginas("dmacd", { filtro: {}, campos: ["acd_codigo", "acd_descricao"] })).forEach((x) => { formas[x.acd_codigo] = x.acd_descricao || ""; });
  const vend = {}; (await todasAsPaginas("dmaao", { filtro: {}, campos: ["aao_codigo", "aao_nome"] })).forEach((x) => { vend[x.aao_codigo] = x.aao_nome; });
  const func = new Set();   // grupo 0002 = FUNCIONÁRIOS no cadastro do cliente (dmalv); revendedora que o Marcus negativou NÃO está nesse grupo
  (await todasAsPaginas("dmaam", { filtro: { aam_grupo: "0002" }, campos: ["aam_codigo"] })).forEach((x) => func.add(x.aam_codigo));
  G.__sorellyCRBase2 = { formas, vend, func, em: Date.now() };
  return G.__sorellyCRBase2;
}

async function calcular(s) {
  const ano = anoAtualBR(), nm = mesAtualBR();
  s.etapa = "Lendo as formas de pagamento e as funcionárias"; s.pct = 2;
  const { formas, vend, func } = await base();

  const chavesAce = new Map();   // título de acerto - loja (prefixo|número|parcela) → cliente, para achar as baixas
  const cli = {};            // por cliente: representante, funcionária?, vendas, saldo, valores por grupo e por mês
  const porConta = {};       // por conta (nome da forma): valores por mês, todos e sem funcionárias
  const novo = () => Array(nm).fill(0);
  for (let m = 1; m <= nm; m++) {
    s.etapa = "Lendo os títulos de " + m + "/" + ano; s.pct = 5 + Math.round((m - 1) / nm * 85);
    const mm = String(m).padStart(2, "0"), fim = new Date(ano, m, 0).getDate();
    const v = await todasAsPaginas("dmabg", { filtro: { abg_emissao: { between: [ano + "-" + mm + "-01T00:00:00", ano + "-" + mm + "-" + fim + "T23:59:59"] } }, campos: ["abg_cliente", "abg_tipodoc", "abg_valor", "abg_saldo", "abg_vencimento", "abg_vendedor", "abg_codorigem2", "abg_banco", "abg_agencia", "abg_conta", "abg_prefixo", "abg_numero", "abg_parcela"] });
    const notas = new Set();
    v.forEach((x) => {
      const c = x.abg_cliente; if (!c || c === "000000") return;
      const o = cli[c] || (cli[c] = { r: "", f: func.has(c) ? 1 : 0, q: novo(), s: novo(), v: "", g: Object.fromEntries(GRUPOS.map((k) => [k, novo()])) });
      const desc = formas[x.abg_tipodoc] || "", g = grupo(desc), val = Number(x.abg_valor) || 0, sal = Number(x.abg_saldo) || 0;
      o.g[g][m - 1] += val; if (x.abg_vendedor) o.r = vend[x.abg_vendedor] || o.r;
      const nk = c + "|" + x.abg_codorigem2; if (!notas.has(nk)) { notas.add(nk); o.q[m - 1]++; }
      if (g === "Acerto loja") chavesAce.set(x.abg_prefixo + "|" + x.abg_numero + "|" + x.abg_parcela, c);
      if (g === "Acerto loja" && sal > 0) { o.s[m - 1] += sal; const vc = String(x.abg_vencimento).slice(0, 10); if (!o.v || vc < o.v) o.v = vc; }
      if (g !== "Acerto loja") { const conta = desc.replace(/\s+/g, " ").trim(); const pc = porConta[conta] || (porConta[conta] = { t: novo(), n: novo(), bk: {} }); pc.t[m - 1] += val; if (!o.f) pc.n[m - 1] += val; const bk = [x.abg_banco, x.abg_agencia, x.abg_conta].filter(Boolean).join(" · "); if (bk) pc.bk[bk] = (pc.bk[bk] || 0) + 1; }
    });
  }

  s.etapa = "Somando"; s.pct = 92;
  const REC = ["Pix", "Link", "Cartão", "Dinheiro", "Outros"], sum = (a, idx) => idx.reduce((t, i) => t + (a[i] || 0), 0);
  const K = { t: {}, n: {} }, RP = { t: {}, n: {} }, A = { t: { v: [], s: [], q: [] }, n: { v: [], s: [], q: [] } };
  for (const q of ["t", "n"]) for (let m = 0; m <= nm; m++) {
    const idx = m ? [m - 1] : Array.from({ length: nm }, (_, i) => i), o = { fat: 0, rec: 0, ace: 0, s: 0, n: 0, dev: 0, func: 0 }, rp = {};
    for (const k of Object.keys(cli)) {
      const c = cli[k], qq = sum(c.q, idx), ace = sum(c.g["Acerto loja"], idx), rec = REC.reduce((t, g) => t + sum(c.g[g], idx), 0), sal = sum(c.s, idx);
      if (c.f) o.func += rec + ace;
      if (q === "n" && c.f) continue;
      if (!qq) continue;
      o.fat += rec + ace; o.rec += rec; o.ace += ace; o.s += sal; o.n++; if (sal > 0) o.dev++;
      const rn = dois(c.r) || "Sem representante", p = rp[rn] || (rp[rn] = [0, 0, 0, 0, 0, 0]);
      p[0] += rec + ace; p[1] += rec; p[2] += ace; p[3] += sal; p[4]++; if (sal > 0) p[5]++;
    }
    for (const kk of Object.keys(o)) o[kk] = r0(o[kk]);
    for (const p of Object.values(rp)) for (let i = 0; i < 4; i++) p[i] = r0(p[i]);
    K[q][m] = o; RP[q][m] = rp;
  }
  for (const q of ["t", "n"]) for (let i = 0; i < nm; i++) {
    let vv = 0, ss = 0, qn = 0;
    for (const c of Object.values(cli)) { if (q === "n" && c.f) continue; vv += c.g["Acerto loja"][i]; ss += c.s[i]; if (c.g["Acerto loja"][i] > 0) qn++; }
    A[q].v.push(r0(vv)); A[q].s.push(r0(ss)); A[q].q.push(qn);
  }
  // ACERTO - LOJA que a revendedora paga DEPOIS (Marcus, 27/10/2026): todo mês entra dinheiro de acertos de meses e anos anteriores.
  // "Efetivamente não recebido" = o SALDO que continua em aberto (de 2026 e de anos anteriores). O dinheiro que entrou de acertos antigos sai das baixas (dmabf).
  s.etapa = "Lendo o acerto - loja de anos anteriores e as baixas"; s.pct = 93;
  const codsAce = Object.keys(formas).filter((c) => /^ACERTO/i.test(formas[c] || ""));
  const velhos = await todasAsPaginas("dmabg", { filtro: { abg_tipodoc: { in: codsAce }, abg_emissao: { lt: ano + "-01-01T00:00:00" } }, campos: ["abg_prefixo", "abg_numero", "abg_parcela", "abg_cliente", "abg_valor", "abg_saldo", "abg_vencimento", "abg_vendedor"] });
  velhos.forEach((x) => chavesAce.set(x.abg_prefixo + "|" + x.abg_numero + "|" + x.abg_parcela, x.abg_cliente));
  const antigo = { t: { s: 0, n: 0, q: 0 }, n: { s: 0, n: 0, q: 0 } }, velhosPorCli = {};
  velhos.forEach((x) => {
    const sal = Number(x.abg_saldo) || 0; if (sal <= 0) return;
    const c = x.abg_cliente, o = velhosPorCli[c] || (velhosPorCli[c] = { saldo: 0, venc: "", rep: "" }), vc = String(x.abg_vencimento).slice(0, 10);
    o.saldo += sal; if (!o.venc || vc < o.venc) o.venc = vc; if (x.abg_vendedor) o.rep = vend[x.abg_vendedor] || o.rep;
    antigo.t.s += sal; antigo.t.q++; if (!func.has(c)) { antigo.n.s += sal; antigo.n.q++; }
  });
  antigo.t.s = r0(antigo.t.s); antigo.n.s = r0(antigo.n.s);
  antigo.t.n = Object.keys(velhosPorCli).length; antigo.n.n = Object.keys(velhosPorCli).filter((c) => !func.has(c)).length;
  const caixa = { t: Array(nm).fill(0), n: Array(nm).fill(0) };   // dinheiro que entrou em cada mês com baixa de acerto - loja (de qualquer emissão)
  const nums = [...new Set([...chavesAce.keys()].map((k) => k.split("|")[1]))];
  for (let i = 0; i < nums.length; i += 150) {
    const mv = await todasAsPaginas("dmabf", { filtro: { abf_numero: { in: nums.slice(i, i + 150) }, abf_tipo: "E", abf_datapgto: { gte: ano + "-01-01T00:00:00" } }, campos: ["abf_prefixo", "abf_numero", "abf_parcela", "abf_datapgto", "abf_valor"] });
    mv.forEach((m) => { const c = chavesAce.get(m.abf_prefixo + "|" + m.abf_numero + "|" + m.abf_parcela); if (c === undefined) return; const mes = Number(String(m.abf_datapgto).slice(5, 7)); if (mes < 1 || mes > nm) return; const val = Number(m.abf_valor) || 0; caixa.t[mes - 1] += val; if (!func.has(c)) caixa.n[mes - 1] += val; });
  }
  A.t.cx = caixa.t.map(r0); A.n.cx = caixa.n.map(r0);
  const C = {};
  for (const [nome, v] of Object.entries(porConta)) C[nome] = { g: titular(nome), f: grupo(nome), bk: Object.entries(v.bk).sort((a, b) => b[1] - a[1]).map((x) => x[0])[0] || "", t: v.t.map(r0), n: v.n.map(r0) };

  // quem não pagou: as maiores do ano (por mês), com e sem funcionárias
  s.etapa = "Lendo os nomes de quem deve"; s.pct = 95;
  const cand = { t: [], n: [] };
  for (const [k, c] of Object.entries(cli)) for (let i = 0; i < nm; i++) if (c.s[i] > 0) { const it = { k, mes: i + 1, saldo: r0(c.s[i]), venc: c.v, rep: c.r }; cand.t.push(it); if (!c.f) cand.n.push(it); }
  for (const [k, o] of Object.entries(velhosPorCli)) { const it = { k, mes: 0, saldo: r0(o.saldo), venc: o.venc, rep: o.rep }; cand.t.push(it); if (!func.has(k)) cand.n.push(it); }
  const top = { t: cand.t.sort((a, b) => b.saldo - a.saldo).slice(0, 40), n: cand.n.sort((a, b) => b.saldo - a.saldo).slice(0, 40) };
  const cods = [...new Set([...top.t, ...top.n].map((x) => x.k))], nomes = {};
  for (let i = 0; i < cods.length; i += 250) (await todasAsPaginas("dmaam", { filtro: { aam_codigo: { in: cods.slice(i, i + 250) } }, campos: ["aam_codigo", "aam_nome"] })).forEach((x) => { nomes[x.aam_codigo] = x.aam_nome; });
  const ab = {};
  for (const q of ["t", "n"]) ab[q] = top[q].map((x) => [tc(nomes[x.k] || x.k).trim(), x.mes, x.saldo, x.venc, dois(x.rep) || "Sem representante"]);

  return { ano, meses: nm, geradoEm: new Date().toISOString(), semFuncionarias: false, funcionarias: func.size, C, A, K, RP, ab, antigo };
}

async function garantirTabela() {
  if (G.__sorellyCRTabela) return;
  await consulta("create table if not exists sorelly.cache_json (chave text primary key, dados jsonb not null, atualizado_em timestamptz not null default now())");
  G.__sorellyCRTabela = true;
}

async function atualizar(forcar) {
  const s = estado();
  if (s.rodando) return;
  s.rodando = true; s.erro = ""; s.pct = 0;
  try {
    const d = await calcular(s);
    s.dados = d; s.em = Date.now();
    await garantirTabela();
    await consulta("insert into sorelly.cache_json (chave, dados, atualizado_em) values ('contas_receber', $1, now()) on conflict (chave) do update set dados = $1, atualizado_em = now()", [JSON.stringify(d)]);
    s.pct = 100; s.etapa = "Pronto";
  } catch (e) { s.erro = e.message || "Falha ao ler a DevMaster."; console.error("contas a receber:", e); }
  finally { s.rodando = false; }
}

// Devolve o que já está pronto (mesmo velho) e atualiza em segundo plano quando passou de 30 minutos.
export async function contasReceber({ forcar = false } = {}) {
  const s = estado();
  if (!s.dados) {
    try { await garantirTabela(); const r = await consulta("select dados, atualizado_em from sorelly.cache_json where chave = 'contas_receber'"); if (r.rows[0]) { s.dados = r.rows[0].dados; s.em = new Date(r.rows[0].atualizado_em).getTime(); } } catch (e) { /* sem banco: calcula do zero */ }
  }
  if (forcar || !s.dados || Date.now() - s.em > TTL || (s.dados && s.dados.ano !== anoAtualBR())) atualizar(forcar);
  if (!s.dados) return { pronto: false, rodando: s.rodando, etapa: s.etapa, pct: s.pct, erro: s.erro };
  return Object.assign({ pronto: true, atualizando: s.rodando, pct: s.pct, etapa: s.etapa, erro: s.erro }, s.dados);
}

// Todos os pagamentos (títulos), linha por linha, para a lista no fim da tela. Cache de 10 minutos.
//   mes = 1..12 → os títulos desse mês   |   mes vazio + soNao → SÓ o acerto - loja (não pagou) de TODOS os meses do ano
async function lerMes(m, ano, soNao, ctx, antigo) {
  const { formas, vend, func } = ctx;
  const mm = String(m).padStart(2, "0"), fim = new Date(ano, m, 0).getDate();
  const filtro = { abg_emissao: { between: [ano + "-" + mm + "-01T00:00:00", ano + "-" + mm + "-" + fim + "T23:59:59"] } };
  if (antigo) { filtro.abg_emissao = { lt: ano + "-01-01T00:00:00" }; filtro.abg_saldo = { gt: 0 }; }   // acerto - loja de anos anteriores que ainda está em aberto
  if (soNao || antigo) filtro.abg_tipodoc = { in: Object.keys(formas).filter((c) => /^ACERTO/i.test(formas[c] || "")) };
  const v = await todasAsPaginas("dmabg", { filtro, campos: ["abg_numero", "abg_parcela", "abg_cliente", "abg_tipodoc", "abg_emissao", "abg_vencimento", "abg_valor", "abg_saldo", "abg_vendedor", "abg_codorigem2", "abg_banco", "abg_agencia", "abg_conta"] });
  const cods = [...new Set(v.map((x) => x.abg_cliente).filter(Boolean))], nomes = {};
  for (let i = 0; i < cods.length; i += 250) (await todasAsPaginas("dmaam", { filtro: { aam_codigo: { in: cods.slice(i, i + 250) } }, campos: ["aam_codigo", "aam_nome"] })).forEach((x) => { nomes[x.aam_codigo] = x.aam_nome; });
  const linhas = [];
  v.forEach((x, i) => {
    const c = x.abg_cliente; if (!c || c === "000000") return;
    const desc = (formas[x.abg_tipodoc] || "").replace(/s+/g, " ").trim(), g = grupo(desc), val = Number(x.abg_valor) || 0, sal = Number(x.abg_saldo) || 0;
    linhas.push({ id: (antigo ? "a-" : m + "-") + i, d: String(x.abg_emissao).slice(0, 10), cod: c, rev: tc(nomes[c] || c).trim(), rep: dois(vend[x.abg_vendedor]) || "Sem representante", nota: String(x.abg_codorigem2 || x.abg_numero || ""), parc: String(x.abg_parcela || ""),
      forma: desc || "Sem forma", grupo: g, titular: g === "Acerto loja" ? "Não pagou" : titular(desc), conta: [x.abg_banco, x.abg_agencia, x.abg_conta].filter(Boolean).join(" / "), valor: Math.round(val * 100) / 100, saldo: Math.round(sal * 100) / 100,
      venc: String(x.abg_vencimento || "").slice(0, 10), nao: g === "Acerto loja" ? 1 : 0, fn: func.has(c) ? 1 : 0 });
  });
  return linhas;
}

export async function titulosDoMes(mes, soNao = false) {
  const ano = anoAtualBR(), nm = mesAtualBR(), m = Number(mes) || 0, todos = !m && soNao, chave = ano + "-" + (todos ? "todos-nao" : (m || nm) + (soNao ? "-nao" : ""));
  const cache = (G.__sorellyCRT2 = G.__sorellyCRT2 || {});
  if (cache[chave] && Date.now() - cache[chave].em < 10 * 60 * 1000) return cache[chave].dados;
  const ctx = await base();
  let linhas = [];
  if (todos) { for (let k = 1; k <= nm; k++) linhas = linhas.concat(await lerMes(k, ano, true, ctx)); linhas = linhas.concat(await lerMes(0, ano, true, ctx, true)); }   // + o que ficou em aberto de anos anteriores
  else linhas = await lerMes(Math.min(12, m || nm), ano, soNao, ctx);
  const dados = { mes: todos ? 0 : (m || nm), ano, soNao: !!soNao, geradoEm: new Date().toISOString(), linhas };
  cache[chave] = { em: Date.now(), dados };
  return dados;
}
