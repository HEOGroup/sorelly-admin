// Cruzamento do Pix da DevMaster com o Pix da Família (Marcus, 21/11/2026). Regra e teste: domain/cruzamento-pix.js e scripts/testar-cruzamento-pix.mjs.
// LER UMA VEZ E GRAVAR (Marcus, 21/11/2026: "leia mais e grave para não precisar ficar lendo sempre"): o servidor lê os títulos da DevMaster desde 2025-01, guarda um resumo de cada mês
// (tabela sorelly.cruzamento_pix_titulos: só Pix de família e sócios, Acerto com loja e Compra funcionários etc.) e guarda o RESULTADO do cruzamento (sorelly.cruzamento_pix_resultado, linha "ultimo").
// A tela só lê o resultado gravado. Os meses antigos não são lidos de novo (só os 2 últimos, a cada 30 minutos); quando o Pix da Família muda, o cruzamento é refeito na hora, sem ler a DevMaster.
// Só leitura da DevMaster. As duas tabelas são cópia derivada: dá para apagar e refazer sem perder nada.
// A Família (módulo ff) só vale para sócios: quem não abre a Família recebe o nome da conta de cada título, mas nunca a lista dos Pix da Família sem título.
import { consulta } from "./db.js";
import { podeModulo } from "./permissoes.js";
import { cruzarPix } from "../apps/montagem/domain/cruzamento-pix.js";

const G = globalThis;
const estado = () => (G.__sorellyCRZ = G.__sorellyCRZ || { rodando: false, etapa: "", pct: 0, erro: "", fim: 0 });
const DESDE = "2025-01";
const VELHICE = 30 * 60 * 1000;
const DATA_OK = /^\d{4}-\d{2}-\d{2}$/;
const lerModulo = async (m) => { const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = $1", [m]); return r.rowCount ? r.rows[0].conteudo : null; };
export const chaveDeTitulo = (x) => [x.cod, x.nota, x.parc, x.d, x.forma, x.valor].join("|");   // a mesma chave da tela (o id da linha muda de leitura para leitura; este não)

let tabelasOk = false;
async function garantirTabelas() {
  if (tabelasOk) return;
  await consulta("create table if not exists sorelly.cruzamento_pix_titulos (mes text primary key, titulos jsonb not null, lido_em timestamptz not null default now())");
  await consulta("create table if not exists sorelly.cruzamento_pix_resultado (id text primary key, conteudo jsonb not null, atualizado_em timestamptz not null default now())");
  tabelasOk = true;
}

const hojeBR = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date());   // "2026-11"
const mesesDe = (de, ate) => { const o = []; let a = Number(de.slice(0, 4)), m = Number(de.slice(5, 7)); while (`${a}-${String(m).padStart(2, "0")}` <= ate && o.length < 120) { o.push(`${a}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; a++; } } return o; };
const mesAnterior = (ym) => { let a = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1; if (m < 1) { m = 12; a--; } return `${a}-${String(m).padStart(2, "0")}`; };

// o que importa de cada título: Pix de família e sócios (casam com a Família), Acerto com loja e Outros (Compra funcionários, taxas...: a 5ª passada olha para eles)
const interessa = (l) => (l.grupo === "Pix" && l.titular === "Família e sócios") || l.grupo === "Acerto loja" || l.grupo === "Outros";
const compacta = (l) => ({ cod: l.cod, nota: l.nota, parc: l.parc, d: l.d, forma: l.forma, grupo: l.grupo, valor: l.valor, saldo: l.saldo, rev: l.rev, fn: l.fn ? 1 : 0 });

async function titulosDoMesGravado(ym, forcar, deps) {
  if (!forcar) { const r = await consulta("select titulos from sorelly.cruzamento_pix_titulos where mes = $1", [ym]); if (r.rowCount) return r.rows[0].titulos; }
  const lerDm = (deps && deps.titulosDoMes) || (await import("./contas-receber.js")).titulosDoMes;
  const d = await lerDm(Number(ym.slice(5, 7)), false, Number(ym.slice(0, 4)));
  const t = (d.linhas || []).filter(interessa).map(compacta);
  await consulta("insert into sorelly.cruzamento_pix_titulos (mes, titulos, lido_em) values ($1, $2::jsonb, now()) on conflict (mes) do update set titulos = excluded.titulos, lido_em = now()", [ym, JSON.stringify(t)]);
  return t;
}

const assinaturaPix = (ff, rcb) => { const l = (ff && ff.pix) || []; return l.length + "|" + Math.round(l.reduce((s, p) => s + (Number(p.valor) || 0), 0) * 100) + "|" + l.filter((p) => p.semAcerto).length + "|" + (((rcb && rcb.antecipados) || []).length); };

// refaz só o cruzamento (sem ler a DevMaster): usa os meses já gravados
async function recalcular(info) {
  await garantirTabelas();
  const [ff, rcb, ms] = await Promise.all([lerModulo("ff"), lerModulo("contasreceber"), consulta("select mes, titulos, lido_em from sorelly.cruzamento_pix_titulos order by mes")]);
  const titulos = []; ms.rows.forEach((r) => r.titulos.forEach((t) => titulos.push(Object.assign({ rid: chaveDeTitulo(t) }, t))));
  const r = ff && Array.isArray(ff.pix) ? cruzarPix(titulos, ff) : { mapa: {}, semTitulo: [] };
  const espelhados = new Set((((rcb && rcb.antecipados) || []).map((x) => x.ffPixId).filter(Boolean)));   // Pix lançado em Contas a receber já aparece como lançamento da tela: não repete na lista
  r.semTitulo = r.semTitulo.filter((p) => !espelhados.has(p.pixId));
  const certezas = {}; Object.values(r.mapa).forEach((m) => { certezas[m.certeza] = (certezas[m.certeza] || 0) + 1; });
  const pix = titulos.filter((t) => t.grupo === "Pix" && !/\bPJ\b/i.test(t.forma || ""));
  const conteudo = {
    geradoEm: new Date().toISOString(), desde: ms.rows.length ? ms.rows[0].mes : "", ate: ms.rows.length ? ms.rows[ms.rows.length - 1].mes : "", meses: ms.rows.length,
    lidoDm: ms.rows.reduce((m, x) => (!m || x.lido_em > m ? x.lido_em : m), null),
    pixSig: assinaturaPix(ff, rcb), semFamilia: !(ff && Array.isArray(ff.pix)),
    resumo: { titulos: titulos.length, titulosPix: pix.length, casados: Object.keys(r.mapa).length, certezas, pixSemTitulo: r.semTitulo.length },
    mapa: r.mapa, semTitulo: r.semTitulo,
  };
  await consulta("insert into sorelly.cruzamento_pix_resultado (id, conteudo, atualizado_em) values ('ultimo', $1::jsonb, now()) on conflict (id) do update set conteudo = excluded.conteudo, atualizado_em = now()", [JSON.stringify(conteudo)]);
  if (info) info.resumo = conteudo.resumo;
  return conteudo;
}

// lê a DevMaster mês a mês (os antigos só uma vez) e refaz o cruzamento. Roda em segundo plano; o andamento fica em estado().
export async function atualizar(opc, deps) {
  const st = estado(); if (st.rodando) return { rodando: true };
  const o = opc || {};
  st.rodando = true; st.etapa = "Preparando"; st.pct = 0; st.erro = "";
  (async () => {
    try {
      await garantirTabelas();
      const agora = hojeBR(), desde = /^\d{4}-\d{2}$/.test(String(o.desde || "")) ? o.desde : DESDE, meses = mesesDe(desde, agora), recentes = new Set([agora, mesAnterior(agora)]);
      for (let i = 0; i < meses.length; i++) {
        st.etapa = "Lendo " + meses[i]; st.pct = Math.round((i / meses.length) * 90);
        await titulosDoMesGravado(meses[i], !!o.tudo || recentes.has(meses[i]), deps);
      }
      st.etapa = "Cruzando"; st.pct = 95;
      await recalcular();
      st.etapa = "Pronto"; st.pct = 100;
    } catch (e) { st.erro = String((e && e.message) || e).slice(0, 300); st.etapa = "Erro"; }
    finally { st.rodando = false; st.fim = Date.now(); }
  })();
  return { rodando: true };
}

// O que a tela lê. Sem resultado gravado: começa a ler e avisa que está atualizando. Resultado velho (30 min): devolve o gravado e atualiza por trás.
export async function resultado(eu) {
  await garantirTabelas();
  const st = estado(), verFf = podeModulo(eu, "ff");
  const r = await consulta("select conteudo, atualizado_em from sorelly.cruzamento_pix_resultado where id = 'ultimo'");
  if (!r.rowCount) { if (!st.rodando) await atualizar({}); return { pronto: false, atualizando: true, etapa: st.etapa, pct: st.pct, erro: st.erro, verFf }; }
  let c = r.rows[0].conteudo;
  if (!st.rodando) {
    const [ff, rcb] = await Promise.all([lerModulo("ff"), lerModulo("contasreceber")]);
    if (assinaturaPix(ff, rcb) !== c.pixSig) c = await recalcular();   // o Pix da Família mudou: refaz o cruzamento agora (sem ler a DevMaster)
    if (Date.now() - new Date(r.rows[0].atualizado_em).getTime() > VELHICE && !st.erro) await atualizar({});
  }
  return { pronto: true, atualizando: st.rodando, etapa: st.etapa, pct: st.pct, erro: st.erro, verFf, geradoEm: c.geradoEm, desde: c.desde, ate: c.ate, meses: c.meses, resumo: c.resumo, mapa: c.mapa, semTitulo: verFf ? c.semTitulo : [] };
}

// Versão sem banco (só a regra, em cima de títulos que chegam prontos): usada nos testes.
export async function cruzar(eu, b, deps) {
  const lista = Array.isArray(b && b.itens) ? b.itens : null;
  if (!lista) return { erro: "Faltam os títulos." };
  if (lista.length > 30000) return { erro: "Títulos demais de uma vez." };
  const itens = lista.map((x) => ({ rid: String((x && x.rid) || ""), rev: String((x && x.rev) || ""), d: String((x && x.d) || ""), valor: Number(x && x.valor), forma: String((x && x.forma) || ""), grupo: x && x.grupo ? String(x.grupo) : undefined })).filter((x) => x.rid && DATA_OK.test(x.d) && x.valor > 0);
  const ler = (deps && deps.ler) || lerModulo;
  const [ff, rcb] = await Promise.all([ler("ff"), ler("contasreceber")]);
  if (!ff || !Array.isArray(ff.pix)) return { mapa: {}, semTitulo: [], verFf: false, semFamilia: true };
  const r = cruzarPix(itens, ff);
  const verFf = podeModulo(eu, "ff");
  const espelhados = new Set((((rcb && rcb.antecipados) || []).map((x) => x.ffPixId).filter(Boolean)));   // Pix lançado em Contas a receber já aparece como lançamento da tela: não repete na lista
  const de = DATA_OK.test(String((b && b.de) || "")) ? b.de : "0000-00-00", ate = DATA_OK.test(String((b && b.ate) || "")) ? b.ate : "9999-99-99";
  const semTitulo = verFf ? r.semTitulo.filter((p) => p.data >= de && p.data <= ate && !espelhados.has(p.pixId)) : [];
  return { mapa: r.mapa, semTitulo, verFf };
}
