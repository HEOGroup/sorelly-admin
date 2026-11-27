// Indicações AO VIVO (19/11/2026, pedido do Leonardo: "trazer o projeto inteiro de indicações do admin antigo, com o que é integrado entre admin e app").
// Mesmo desenho do admin antigo (sorelly-admin, docs/modulos/indicacoes.md): o STATUS de tudo mora no app; este sistema lê e avança pelo app e guarda só o que o app não tem.
//   - Funil das indicadas, pedidos de prêmio (resgates), saldo de moedas e catálogo de prêmios: API do app (MOBILE_API_URL + MOBILE_API_KEY, rotas /admin/indicacoes/*).
//   - Dados de balcão de cada pedido (peças, valor em venda, data da retirada, em contato, maleta...): tabela sorelly.indicacao_resgate_operacao (mesmo formato do antigo).
//   - Planilha antiga de indicações (antes do app): tabela sorelly.indicacao_historico_legado (mesmo formato do antigo).
//   - Indicação manual: cria o lead na Kommo (funil Cadastro, etapa Setor de Cadastro, tag INDICAÇÃO) e registra no funil do app, igual ao admin antigo e ao sorelly-forms.
// PONTE com o admin antigo: scripts/migrar-indicacoes-admin-antigo.mjs copia as duas tabelas do banco antigo; com ADMIN_ANTIGO_DATABASE_URL no servidor, a cópia do balcão
// roda sozinha a cada 2 minutos (só do antigo para cá; vale a linha mexida por último). Assim, enquanto a equipe ainda usa o antigo, os dois mostram o mesmo.
// SEGURANÇA: o .env de desenvolvimento aponta para a PRODUÇÃO do app. Gravar no app só com INDICACOES_GRAVAR=1; gravar na Kommo só com INDICACOES_KOMMO_GRAVAR=1
// (o Marcus decidiu em 17/11/2026 "nunca gravar no Kommo" para a leitura do funil; a indicação manual é a única gravação, e só liga quem decidir).
// As telas continuam as do protótipo (pages/indicacoes/*): o servidor entrega o mesmo formato do estado s.ind (domain/indicacoes.js), com aoVivo:true.
import { randomUUID } from "node:crypto";
import pg from "pg";
import { consulta } from "./db.js";
import { podeModulo } from "./permissoes.js";
import { listaDevmaster, norm } from "./devmaster.js";

const G = globalThis;
const VERSAO_APP = "3.5.0";
const erroHttp = (msg, status) => Object.assign(new Error(msg), { statusCode: status });
const texto = (v) => (typeof v === "string" ? v.trim() : "");
const numero = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const digitos = (v) => String(v == null ? "" : v).replace(/\D/g, "");

// ---------- quem pode ----------
// Indicações = módulo "ind" (setores cadastro e kitsnovos; a Diretoria abre tudo). O Agendamento (Atendimento Sorelly › Brinde de indicação) lê os pedidos em aberto e confirma a retirada.
export const podeIndicacoes = (eu) => podeModulo(eu, "ind");
const ehAgendamento = (eu) => (eu?.setores || []).includes("agendamento");
export const podeLer = (eu) => podeIndicacoes(eu) || ehAgendamento(eu);
export const podeAcao = (eu, op) => podeIndicacoes(eu) || (ehAgendamento(eu) && op === "resgate_entregar");

// ---------- interruptores de gravação ----------
export const gravaApp = () => process.env.INDICACOES_GRAVAR === "1";
export const gravaKommo = () => process.env.INDICACOES_KOMMO_GRAVAR === "1";
const exigeApp = () => { if (!gravaApp()) throw erroHttp("A gravação no app está desligada neste servidor (variável INDICACOES_GRAVAR=1 liga). Nada foi alterado.", 503); };

// ---------- números do balcão (os mesmos do admin antigo e de domain/indicacoes.js) ----------
const HORA_INICIO = 8 * 60, HORA_FIM = 18 * 60, PASSO = 30, DIAS_RETROATIVOS = 30;
const OBS_MAX = 2000, NOME_MAX = 120, MOTIVO_MOEDAS_MAX = 120, MOEDAS_MIN = 1, MOEDAS_MAX = 100000;
const ETAPAS_RESGATE = ["solicitado", "aprovado", "entregue", "cancelado"];
const ETAPAS_FUNIL = ["criado", "em_andamento", "cadastro_aprovado", "finalizado", "cancelado"];
const ORDEM_FUNIL = ["criado", "em_andamento", "cadastro_aprovado", "finalizado"];
const ROTULO_FUNIL = { criado: "Novas", em_andamento: "Em andamento", cadastro_aprovado: "Cadastro aprovado", finalizado: "Kit entregue", cancelado: "Canceladas" };

// ---------- datas (as telas usam "AAAA-MM-DDTHH:MM:SS" no horário de Brasília, sem fuso) ----------
const FMT_SP = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
export function paraSP(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d) ? null : FMT_SP.format(d).replace(" ", "T");
}
// "2026-11-19T14:30" (Brasília) → instante em UTC (ISO com Z)
export function deSP(local) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(local || "").trim());
  if (!m) return null;
  const comoUtc = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)));
  const visto = new Date(paraSP(comoUtc) + "Z");   // o mesmo instante lido em Brasília
  return new Date(comoUtc.getTime() + (comoUtc.getTime() - visto.getTime())).toISOString();
}
const hojeSP = () => paraSP(new Date()).slice(0, 10);
const somaDias = (dia, n) => new Date(Date.UTC(+dia.slice(0, 4), +dia.slice(5, 7) - 1, +dia.slice(8, 10) + n)).toISOString().slice(0, 10);
const iso = (d) => (d ? new Date(d).toISOString() : null);

// ---------- cliente do app ----------
function configApp() {
  const base = (process.env.MOBILE_API_URL || "").trim().replace(/\/+$/, ""), chave = (process.env.MOBILE_API_KEY || "").trim();
  if (!base || !chave) throw erroHttp("A ligação com o app não está configurada no servidor (MOBILE_API_URL e MOBILE_API_KEY).", 503);
  return { base, chave };
}
export async function app(metodo, caminho, corpo) {
  const { base, chave } = configApp();
  if (metodo !== "GET") exigeApp();
  let r;
  try {
    r = await fetch(base + caminho, {
      method: metodo, cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { Authorization: "Bearer " + chave, "X-App-Version": VERSAO_APP, Accept: "application/json", ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch (x) { throw erroHttp("O app não respondeu (" + ((x && x.message) || "sem conexão") + ").", 503); }
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (x) { /* corpo que não é JSON */ }
  return { status: r.status, j };
}
const msgDe = (j, padrao) => (j && typeof j.error === "string" && j.error.trim()) || padrao;
const listaDe = (j, chaves) => { if (Array.isArray(j)) return j; for (const k of chaves) if (j && Array.isArray(j[k])) return j[k]; return null; };

// ---------- tabelas (já existem no banco do protótipo; aqui só para banco novo e para o teste) ----------
let pronta = null;
export function garantirTabelas() {
  if (!pronta) pronta = (async () => {
    await consulta(`create table if not exists sorelly.indicacao_resgate_operacao (
      id text primary key, "resgateId" integer not null, "codigosPecas" text[] default array[]::text[], "responsavelNome" text, observacao text, "dataAgendada" timestamp(3),
      "vendidoSistema" boolean not null default false, "emContato" boolean not null default false, "emContatoEm" timestamp(3), "atualizadoPor" text,
      "createdAt" timestamp(3) not null default current_timestamp, "updatedAt" timestamp(3) not null, "valorVendaCentavos" integer, "valorDiferencaBrindeCentavos" integer,
      "retiradaMaleta" boolean not null default false, "dataAcertoMaleta" timestamp(3), "representanteMaleta" text, "vendidoSistemaEm" timestamp(3),
      "pecasNaoVendidas" boolean not null default false, "pecasNaoVendidasEm" timestamp(3))`);
    await consulta(`create unique index if not exists "indicacao_resgate_operacao_resgateId_key" on sorelly.indicacao_resgate_operacao ("resgateId")`);
    await consulta(`create table if not exists sorelly.indicacao_historico_legado (
      id text primary key, "linhaPlanilha" integer not null, "revendedoraChave" text not null, "nomeRevendedora" text not null, "telefoneRevendedora" text, categoria text not null,
      "dataIndicacao" date, "nomeIndicada" text, "telefoneIndicada" text, status text not null, "dataAprovacao" date, "dataKitEntregue" date, "contaMoedas" boolean not null,
      "aVerificar" boolean not null default false, motivo text, observacao text, "createdAt" timestamp(3) not null default current_timestamp, "updatedAt" timestamp(3) not null)`);
    await consulta(`create unique index if not exists "indicacao_historico_legado_linhaPlanilha_key" on sorelly.indicacao_historico_legado ("linhaPlanilha")`);
  })().catch((e) => { pronta = null; throw e; });
  return pronta;
}

// ---------- balcão (dados que o app não tem) ----------
const COLS_OP = `"resgateId", "codigosPecas", "responsavelNome", observacao, "dataAgendada" at time zone 'UTC' as "dataAgendada", "valorVendaCentavos", "valorDiferencaBrindeCentavos",
  "vendidoSistema", "vendidoSistemaEm" at time zone 'UTC' as "vendidoSistemaEm", "pecasNaoVendidas", "pecasNaoVendidasEm" at time zone 'UTC' as "pecasNaoVendidasEm",
  "emContato", "emContatoEm" at time zone 'UTC' as "emContatoEm", "retiradaMaleta", "dataAcertoMaleta" at time zone 'UTC' as "dataAcertoMaleta", "representanteMaleta",
  "atualizadoPor", "updatedAt" at time zone 'UTC' as "updatedAt"`;
// códigos de peça: aceita texto colado com espaço, vírgula, ;, /, | e quebra de linha; sai em maiúsculas, sem vazios e sem repetidos
export function normalizarCodigosPecas(entrada) {
  const bruto = Array.isArray(entrada) ? entrada.join(" ") : String(entrada || ""), vistos = new Set(), out = [];
  bruto.split(/[\s,;/|]+/).forEach((p) => { const c = p.trim().toUpperCase(); if (c && !vistos.has(c)) { vistos.add(c); out.push(c); } });
  return out;
}
const opVazia = () => ({ codigosPecas: [], responsavelNome: null, observacao: null, dataAgendada: null, valorVenda: null, valorDiferencaBrinde: null, vendidoSistema: false, vendidoSistemaEm: null,
  pecasNaoVendidas: false, pecasNaoVendidasEm: null, emContato: false, emContatoEm: null, retiradaMaleta: false, dataAcertoMaleta: null, representanteMaleta: null, atualizadoPor: null, atualizadoEm: null });
// linha do banco → "operacao" do estado das telas (reais, datas em Brasília)
function opDaLinha(x) {
  if (!x) return opVazia();
  return { codigosPecas: x.codigosPecas || [], responsavelNome: x.responsavelNome, observacao: x.observacao, dataAgendada: paraSP(x.dataAgendada),
    valorVenda: x.valorVendaCentavos == null ? null : x.valorVendaCentavos / 100, valorDiferencaBrinde: x.valorDiferencaBrindeCentavos == null ? null : x.valorDiferencaBrindeCentavos / 100,
    vendidoSistema: !!x.vendidoSistema, vendidoSistemaEm: paraSP(x.vendidoSistemaEm), pecasNaoVendidas: !!x.pecasNaoVendidas, pecasNaoVendidasEm: paraSP(x.pecasNaoVendidasEm),
    emContato: !!x.emContato, emContatoEm: paraSP(x.emContatoEm), retiradaMaleta: !!x.retiradaMaleta, dataAcertoMaleta: x.dataAcertoMaleta ? new Date(x.dataAcertoMaleta).toISOString().slice(0, 10) : null,
    representanteMaleta: x.representanteMaleta, atualizadoPor: x.atualizadoPor, atualizadoEm: paraSP(x.updatedAt) };
}
export async function lerBalcao(ids) {
  await garantirTabelas();
  const r = ids ? await consulta(`select ${COLS_OP} from sorelly.indicacao_resgate_operacao where "resgateId" = any($1::int[])`, [ids]) : await consulta(`select ${COLS_OP} from sorelly.indicacao_resgate_operacao`);
  return new Map(r.rows.map((x) => [Number(x.resgateId), x]));
}
const centavos = (v, campo) => {
  if (v === null || v === "") return null;
  const n = Math.round(Number(v) * 100);
  if (!Number.isFinite(n) || n < 0) throw erroHttp(campo + ": o valor não pode ser negativo.", 400);
  return n;
};
// Grava os dados de balcão. d vem no formato das telas (reais, datas de Brasília). Campo não enviado (undefined) NÃO apaga; null limpa. Nunca muda a etapa do pedido.
export async function salvarBalcao(resgateId, d, por) {
  const id = Number(resgateId);
  if (!Number.isInteger(id) || id <= 0) throw erroHttp("Pedido inválido.", 400);
  if (d.status !== undefined || d.etapa !== undefined) throw erroHttp("Os dados do balcão não mudam a etapa do pedido.", 400);
  const atual = (await lerBalcao([id])).get(id) || null, agora = new Date().toISOString();
  const v = {
    codigosPecas: atual ? atual.codigosPecas || [] : [], responsavelNome: atual ? atual.responsavelNome : null, observacao: atual ? atual.observacao : null,
    dataAgendada: atual ? iso(atual.dataAgendada) : null, valorVendaCentavos: atual ? atual.valorVendaCentavos : null, valorDiferencaBrindeCentavos: atual ? atual.valorDiferencaBrindeCentavos : null,
    vendidoSistema: atual ? !!atual.vendidoSistema : false, vendidoSistemaEm: atual ? iso(atual.vendidoSistemaEm) : null, pecasNaoVendidas: atual ? !!atual.pecasNaoVendidas : false,
    pecasNaoVendidasEm: atual ? iso(atual.pecasNaoVendidasEm) : null, emContato: atual ? !!atual.emContato : false, emContatoEm: atual ? iso(atual.emContatoEm) : null,
    retiradaMaleta: atual ? !!atual.retiradaMaleta : false, dataAcertoMaleta: atual ? iso(atual.dataAcertoMaleta) : null, representanteMaleta: atual ? atual.representanteMaleta : null,
  };
  if (d.codigosPecas !== undefined) v.codigosPecas = d.codigosPecas == null ? [] : normalizarCodigosPecas(d.codigosPecas);
  for (const k of ["responsavelNome", "observacao"]) if (d[k] !== undefined) v[k] = d[k] == null ? null : (texto(String(d[k])) || null);
  if (v.observacao && v.observacao.length > OBS_MAX) throw erroHttp("A observação passou de " + OBS_MAX + " caracteres.", 400);
  if (v.responsavelNome && v.responsavelNome.length > NOME_MAX) throw erroHttp("O nome do responsável é grande demais.", 400);
  if (d.dataAgendada !== undefined) {
    if (!d.dataAgendada) v.dataAgendada = null;
    else { const u = /Z$|[+-]\d{2}:\d{2}$/.test(String(d.dataAgendada)) ? iso(d.dataAgendada) : deSP(d.dataAgendada); if (!u) throw erroHttp("Data da retirada inválida.", 400); v.dataAgendada = u; }
  }
  if (d.valorVenda !== undefined) v.valorVendaCentavos = centavos(d.valorVenda, "Valor em venda");
  if (d.valorDiferencaBrinde !== undefined) v.valorDiferencaBrindeCentavos = centavos(d.valorDiferencaBrinde, "Diferença do brinde");
  // a data da marca nasce quando ela vira verdadeira; desmarcar limpa
  for (const k of ["vendidoSistema", "pecasNaoVendidas", "emContato"]) if (d[k] !== undefined) { const on = !!d[k]; if (on && !v[k]) v[k + "Em"] = agora; if (!on) v[k + "Em"] = null; v[k] = on; }
  if (d.retiradaMaleta !== undefined) { v.retiradaMaleta = !!d.retiradaMaleta; if (!v.retiradaMaleta) { v.dataAcertoMaleta = null; v.representanteMaleta = null; } }
  if (d.dataAcertoMaleta !== undefined && d.retiradaMaleta !== false) {
    const dm = texto(String(d.dataAcertoMaleta || ""));
    if (dm && !/^\d{4}-\d{2}-\d{2}$/.test(dm)) throw erroHttp("Data do acerto inválida.", 400);
    v.dataAcertoMaleta = dm ? dm + "T12:00:00.000Z" : null;   // dia gravado ao meio-dia UTC, como no antigo
  }
  if (d.representanteMaleta !== undefined && d.retiradaMaleta !== false) v.representanteMaleta = texto(String(d.representanteMaleta || "")) || null;
  await consulta(`insert into sorelly.indicacao_resgate_operacao (id, "resgateId", "codigosPecas", "responsavelNome", observacao, "dataAgendada", "valorVendaCentavos", "valorDiferencaBrindeCentavos",
      "vendidoSistema", "vendidoSistemaEm", "pecasNaoVendidas", "pecasNaoVendidasEm", "emContato", "emContatoEm", "retiradaMaleta", "dataAcertoMaleta", "representanteMaleta", "atualizadoPor", "createdAt", "updatedAt")
    values ($1, $2, $3::text[], $4, $5, $6::timestamp, $7, $8, $9, $10::timestamp, $11, $12::timestamp, $13, $14::timestamp, $15, $16::timestamp, $17, $18, $19::timestamp, $19::timestamp)
    on conflict ("resgateId") do update set "codigosPecas" = excluded."codigosPecas", "responsavelNome" = excluded."responsavelNome", observacao = excluded.observacao,
      "dataAgendada" = excluded."dataAgendada", "valorVendaCentavos" = excluded."valorVendaCentavos", "valorDiferencaBrindeCentavos" = excluded."valorDiferencaBrindeCentavos",
      "vendidoSistema" = excluded."vendidoSistema", "vendidoSistemaEm" = excluded."vendidoSistemaEm", "pecasNaoVendidas" = excluded."pecasNaoVendidas", "pecasNaoVendidasEm" = excluded."pecasNaoVendidasEm",
      "emContato" = excluded."emContato", "emContatoEm" = excluded."emContatoEm", "retiradaMaleta" = excluded."retiradaMaleta", "dataAcertoMaleta" = excluded."dataAcertoMaleta",
      "representanteMaleta" = excluded."representanteMaleta", "atualizadoPor" = excluded."atualizadoPor", "updatedAt" = excluded."updatedAt"`,
  [randomUUID(), id, v.codigosPecas, v.responsavelNome, v.observacao, v.dataAgendada, v.valorVendaCentavos, v.valorDiferencaBrindeCentavos, v.vendidoSistema, v.vendidoSistemaEm,
    v.pecasNaoVendidas, v.pecasNaoVendidasEm, v.emContato, v.emContatoEm, v.retiradaMaleta, v.dataAcertoMaleta, v.representanteMaleta, por || null, agora]);
  return v;
}

// ---------- leituras do app ----------
function lerResgate(b) {
  if (!b || typeof b.id !== "number" || !ETAPAS_RESGATE.includes(b.status)) return null;
  return { id: b.id, userId: numero(b.userId), premioCodigo: String(b.premioCodigo ?? ""), premioTitulo: String(b.premioTitulo ?? ""), premioValorCentavos: Number(b.premioValorCentavos ?? 0),
    custoMoedas: Number(b.custoMoedas ?? 0), status: b.status, retiradaEm: texto(b.retiradaEm) || null, criadoEm: texto(b.criadoEm) || null, entregueEm: texto(b.entregueEm) || null,
    canceladoEm: texto(b.canceladoEm) || null, canceladoMotivo: texto(b.canceladoMotivo) || null };
}
async function resgatesDoApp() {
  const listas = await Promise.all(ETAPAS_RESGATE.map(async (st) => {
    const { status, j } = await app("GET", "/admin/indicacoes/resgates?status=" + st);
    const l = status === 200 ? listaDe(j, ["resgates", "data", "items"]) : null;
    if (!l) throw erroHttp("Não foi possível carregar os pedidos \"" + st + "\" no app (" + status + ").", 503);
    return l.map(lerResgate).filter(Boolean);
  }));
  return listas.flat();
}
// um pedido, direto do app (a etapa real; o detalhe não traz userId)
async function resgateDoApp(id) {
  const { status, j } = await app("GET", "/admin/indicacoes/resgates/" + encodeURIComponent(String(id)));
  if (status === 404) throw erroHttp("Pedido #" + id + " não encontrado no app.", 404);
  const r = status === 200 ? lerResgate((j && j.resgate) || j) : null;
  if (!r) throw erroHttp("Não foi possível ler o pedido #" + id + " no app (" + status + ").", 503);
  return r;
}
function lerIndicacao(b) {
  if (!b || typeof b.id !== "number" || !ETAPAS_FUNIL.includes(b.status)) return null;
  const ind = b.indicada || {}, rv = b.revendedora || {};
  return { id: b.id, status: b.status, leadId: numero(b.leadId), moedasCreditadas: numero(b.moedasCreditadas) || 0, creditadoEm: texto(b.creditadoEm) || null,
    statusAlteradoEm: texto(b.statusAlteradoEm) || null, criadoEm: texto(b.criadoEm) || null,
    indicada: { nome: texto(ind.nome), whatsapp: texto(ind.whatsapp) }, revendedora: { id: numero(rv.id), nome: texto(rv.nome), email: texto(rv.email), telefone: texto(rv.telefone) } };
}
async function funilDoApp() {
  const todas = [];
  for (let offset = 0; offset < 20000; offset += 200) {
    const { status, j } = await app("GET", "/admin/indicacoes?limit=200&offset=" + offset);
    const l = status === 200 ? listaDe(j, ["indicacoes", "data", "items"]) : null;
    if (!l) throw erroHttp("Não foi possível carregar as indicações no app (" + status + ").", 503);
    todas.push(...l.map(lerIndicacao).filter(Boolean));
    const pg_ = (j && j.paginacao) || {};
    if (!(pg_.hasMore === true || (pg_.hasMore === undefined && l.length === 200))) break;
  }
  return todas;
}
// revendedoras com indicação ou moeda (o app ordena: com indicação primeiro, depois com moeda, depois o resto; para no primeiro "resto")
async function rankingDoApp() {
  const out = [];
  for (let page = 1; page <= 200; page++) {
    const { status, j } = await app("GET", "/admin/indicacoes/revendedoras?page=" + page + "&pageSize=50");
    if (status !== 200 || !j || !Array.isArray(j.items)) throw erroHttp("Não foi possível listar as revendedoras no app (" + status + ").", 503);
    let acabou = j.items.length < 50;
    for (const x of j.items) {
      if (typeof x?.id !== "number") continue;
      const ind = Number(x.indicacoes) || 0, mo = Number(x.moedas) || 0;
      if (!ind && !mo) { acabou = true; break; }
      out.push({ id: x.id, nome: texto(x.nome), email: texto(x.email), telefone: texto(x.telefone), moedas: mo, indicacoesApp: ind });
    }
    if (acabou || page * 50 >= (Number(j.total) || 0)) break;
  }
  return out;
}
async function premiosDoApp(revId) {
  const { status, j } = await app("GET", "/admin/indicacoes/revendedoras/" + encodeURIComponent(String(revId)) + "/premios");
  if (status !== 200 || !j || !Array.isArray(j.premios)) return null;
  return { saldoMoedas: numero(j.saldoMoedas), premios: j.premios.map((p) => ({ codigo: String(p.codigo ?? ""), titulo: String(p.titulo ?? ""), custoMoedas: Number(p.custoMoedas ?? 0), valor: Number(p.valorCentavos ?? 0) / 100, resgatavel: p.resgatavel === true })) };
}

// ---------- Kommo ----------
const KOMMO = {
  pipelineId: 14137091, statusSetorCadastro: 109136447, phoneFieldId: 1715942, tagIndicacao: { id: 148486, name: "INDICAÇÃO" }, reprovadaFieldId: 1716048,
  campos: { nome: 2073620, cidade: 2073622, endereco: 2073624, cep: 2073626, profissao: 2073628, empresa_nome: 2073636, empresa_tempo_atuacao: 2073630, empresa_endereco: 2073634, observacoes: 2075024 },
  indicadora: { idRevendedora: 2083841, nome: 2083843, telefone: 2083845, email: 2083847, cpf: 2083849 },
};
// Kommo ocupada (429) ou com erro (5xx): tenta de novo até 4 vezes, esperando o Retry-After ou 1, 2, 4 e 8 s (igual ao admin antigo, lib/kommo/client.ts)
async function kommo(metodo, rota, corpo, tentativa = 0) {
  const base = String(process.env.KOMMO_API_URL || "https://sorelly.kommo.com").trim().replace(/\/+$/, ""), token = String(process.env.KOMMO_ACCESS_TOKEN || "").trim();
  if (!token) throw erroHttp("Falta KOMMO_ACCESS_TOKEN no servidor.", 503);
  let r;
  try { r = await fetch(base + rota, { method: metodo, cache: "no-store", signal: AbortSignal.timeout(20000), headers: { Authorization: "Bearer " + token, Accept: "application/json", ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}) }, body: corpo !== undefined ? JSON.stringify(corpo) : undefined }); }
  catch (x) { throw erroHttp("A Kommo não respondeu.", 503); }
  if ((r.status === 429 || r.status >= 500) && tentativa < 4) {
    const ra = Number(r.headers.get("retry-after")), espera = Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(1000 * 2 ** tentativa, 8000);
    await new Promise((z) => setTimeout(z, espera));
    return kommo(metodo, rota, corpo, tentativa + 1);
  }
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (x) { /* vazio */ }
  return { status: r.status, j };
}
// motivo da cancelada = select "Reprovada" do lead (leitura; guardado 30 min). Uma falha da Kommo só deixa o motivo vazio.
const motivos = G.__indMotivos || (G.__indMotivos = new Map());
let enumsReprovada = null;
async function motivoDoLead(leadId) {
  const c = motivos.get(leadId);
  if (c && Date.now() - c.em < 30 * 60000) return c.motivo;
  const r = await kommo("GET", "/api/v4/leads/" + leadId);
  if (r.status !== 200 || !r.j) throw erroHttp("lead", 503);
  const campo = (r.j.custom_fields_values || []).find((x) => x.field_id === KOMMO.reprovadaFieldId), v = campo && campo.values && campo.values[0];
  let motivo = v && typeof v.value === "string" && v.value.trim() ? v.value.trim() : null;
  if (!motivo && v && typeof v.enum_id === "number") {
    if (!enumsReprovada) { const f = await kommo("GET", "/api/v4/leads/custom_fields/" + KOMMO.reprovadaFieldId); enumsReprovada = f.status === 200 && f.j ? (f.j.enums || []) : []; }
    const e = enumsReprovada.find((x) => x.id === v.enum_id); motivo = e ? String(e.value || "").trim() || null : null;
  }
  motivos.set(leadId, { motivo, em: Date.now() });
  return motivo;
}
// lê os motivos que faltam, 3 por vez (a Kommo aceita ~7 chamadas por segundo), por no máximo ~4 s (o resto entra na próxima leitura)
async function completarMotivos(leadIds) {
  if (!String(process.env.KOMMO_ACCESS_TOKEN || "").trim()) return;
  const falta = [...new Set(leadIds)].filter((id) => { const c = motivos.get(id); return !c || Date.now() - c.em >= 30 * 60000; });
  if (!falta.length) return;
  let i = 0;
  const trilha = async () => { while (i < falta.length) { const id = falta[i++]; try { await motivoDoLead(id); } catch (x) { motivos.set(id, { motivo: null, em: Date.now() - 25 * 60000 }); } } };
  await Promise.race([Promise.all(Array.from({ length: Math.min(3, falta.length) }, trilha)), new Promise((z) => setTimeout(z, 4000))]);
}

// ---------- ponte com o admin antigo (só do antigo para cá) ----------
// Copia o balcão e a planilha antiga (vale a linha com updatedAt mais novo; nada é apagado). Devolve um resumo. aplicar=false só conta.
// planilha "se_vazia" = só copia a planilha quando a tabela daqui ainda está vazia (a planilha não muda mais; a ponte automática usa assim).
export async function copiarDoAntigo(urlAntigo, { aplicar = true, planilha = "sempre" } = {}) {
  await garantirTabelas();
  const cli = new pg.Client({ connectionString: urlAntigo, ssl: { rejectUnauthorized: true } });
  await cli.connect();
  try {
    await cli.query("set default_transaction_read_only = on");   // o antigo só é lido
    const sc = async (t) => (await cli.query("select table_schema from information_schema.tables where table_name = $1 order by (table_schema = 'public') desc limit 1", [t])).rows[0]?.table_schema || null;
    const so = await sc("indicacao_resgate_operacao"), sl = await sc("indicacao_historico_legado");
    const ops = so ? (await cli.query(`select coalesce(json_agg(t order by "resgateId"), '[]'::json) as j from "${so}".indicacao_resgate_operacao t`)).rows[0].j : [];
    const qtdLegAqui = (await consulta("select count(*)::int as n from sorelly.indicacao_historico_legado")).rows[0].n;
    const leg = sl && (planilha !== "se_vazia" || qtdLegAqui === 0) ? (await cli.query(`select coalesce(json_agg(t order by "linhaPlanilha"), '[]'::json) as j from "${sl}".indicacao_historico_legado t`)).rows[0].j : [];
    const aqui = new Set((await consulta(`select "resgateId" from sorelly.indicacao_resgate_operacao`)).rows.map((x) => Number(x.resgateId)));
    const resumo = { balcaoNoAntigo: ops.length, balcaoNovo: ops.filter((o) => !aqui.has(Number(o.resgateId))).length, planilhaNoAntigo: leg.length, planilhaAqui: qtdLegAqui, aplicado: false };
    if (aplicar) {
      for (let i = 0; i < ops.length; i += 500) {
        await consulta(`insert into sorelly.indicacao_resgate_operacao select * from json_populate_recordset(null::sorelly.indicacao_resgate_operacao, $1::json)
          on conflict ("resgateId") do update set "codigosPecas" = excluded."codigosPecas", "responsavelNome" = excluded."responsavelNome", observacao = excluded.observacao,
            "dataAgendada" = excluded."dataAgendada", "valorVendaCentavos" = excluded."valorVendaCentavos", "valorDiferencaBrindeCentavos" = excluded."valorDiferencaBrindeCentavos",
            "vendidoSistema" = excluded."vendidoSistema", "vendidoSistemaEm" = excluded."vendidoSistemaEm", "pecasNaoVendidas" = excluded."pecasNaoVendidas", "pecasNaoVendidasEm" = excluded."pecasNaoVendidasEm",
            "emContato" = excluded."emContato", "emContatoEm" = excluded."emContatoEm", "retiradaMaleta" = excluded."retiradaMaleta", "dataAcertoMaleta" = excluded."dataAcertoMaleta",
            "representanteMaleta" = excluded."representanteMaleta", "atualizadoPor" = excluded."atualizadoPor", "updatedAt" = excluded."updatedAt"
          where excluded."updatedAt" > sorelly.indicacao_resgate_operacao."updatedAt"`, [JSON.stringify(ops.slice(i, i + 500))]);
      }
      if (leg.length) {
        for (let i = 0; i < leg.length; i += 1000) {
          await consulta(`insert into sorelly.indicacao_historico_legado select * from json_populate_recordset(null::sorelly.indicacao_historico_legado, $1::json)
            on conflict ("linhaPlanilha") do update set "revendedoraChave" = excluded."revendedoraChave", "nomeRevendedora" = excluded."nomeRevendedora", "telefoneRevendedora" = excluded."telefoneRevendedora",
              categoria = excluded.categoria, "dataIndicacao" = excluded."dataIndicacao", "nomeIndicada" = excluded."nomeIndicada", "telefoneIndicada" = excluded."telefoneIndicada", status = excluded.status,
              "dataAprovacao" = excluded."dataAprovacao", "dataKitEntregue" = excluded."dataKitEntregue", "contaMoedas" = excluded."contaMoedas", "aVerificar" = excluded."aVerificar",
              motivo = excluded.motivo, observacao = excluded.observacao, "updatedAt" = excluded."updatedAt"
            where excluded."updatedAt" > sorelly.indicacao_historico_legado."updatedAt"`, [JSON.stringify(leg.slice(i, i + 1000))]);
        }
      }
      resumo.aplicado = true;
      resumo.planilhaAqui = (await consulta("select count(*)::int as n from sorelly.indicacao_historico_legado")).rows[0].n;
      resumo.balcaoAqui = (await consulta("select count(*)::int as n from sorelly.indicacao_resgate_operacao")).rows[0].n;
    }
    return resumo;
  } finally { await cli.end().catch(() => {}); }
}
// com ADMIN_ANTIGO_DATABASE_URL no servidor: a cada 2 minutos, no máximo (erro não derruba a tela)
async function ponteAutomatica() {
  const url = String(process.env.ADMIN_ANTIGO_DATABASE_URL || "").trim();
  if (!url || url === String(process.env.DATABASE_URL || "").trim()) return;
  const st = G.__indPonte || (G.__indPonte = { em: 0, rodando: null, erro: null });
  if (st.rodando) return st.rodando;
  if (Date.now() - st.em < 2 * 60000) return;
  st.rodando = copiarDoAntigo(url, { planilha: "se_vazia" }).then(() => { st.erro = null; }, (x) => { st.erro = (x && x.message) || "falhou"; console.error("[indicacoes] ponte com o admin antigo:", st.erro); })
    .finally(() => { st.em = Date.now(); st.rodando = null; });
  return st.rodando;
}

// ---------- planilha antiga ----------
async function lerArquivo() {
  await garantirTabelas();
  const r = await consulta(`select "linhaPlanilha", "nomeRevendedora", "telefoneRevendedora", categoria, to_char("dataIndicacao", 'YYYY-MM-DD') as "dataIndicacao", "nomeIndicada", "telefoneIndicada", status,
    to_char("dataAprovacao", 'YYYY-MM-DD') as "dataAprovacao", to_char("dataKitEntregue", 'YYYY-MM-DD') as "dataKitEntregue", "contaMoedas", "aVerificar", motivo, observacao
    from sorelly.indicacao_historico_legado order by "linhaPlanilha"`);
  if (r.rows.length) return r.rows;
  // ainda sem a cópia do antigo: usa a planilha que veio na importação de 17/11/2026 (módulo ind)
  try { const m = (await consulta("select conteudo->'arquivo' as a from sorelly.estado_modulo where modulo = 'ind'")).rows[0]; return (m && Array.isArray(m.a)) ? m.a : []; } catch (x) { return []; }
}
async function versaoArquivo() {
  await garantirTabelas();
  const r = (await consulta(`select count(*)::int as n, coalesce(max("updatedAt")::text, '') as m from sorelly.indicacao_historico_legado`)).rows[0];
  return r.n + "|" + r.m;
}

// ---------- caches por parte (vários computadores abertos não multiplicam as chamadas ao app) ----------
const VALE = { resgates: 20000, funil: 30000, ranking: 60000, premios: 30 * 60000 };
const caches = G.__indCaches || (G.__indCaches = {});
function emCache(parte, fn, forcar) {
  const c = caches[parte] || (caches[parte] = { em: 0, v: null, p: null });
  if (c.p) return c.p;
  if (!forcar && c.v && Date.now() - c.em < VALE[parte]) return Promise.resolve(c.v);
  c.p = fn().then((v) => { c.v = v; c.em = Date.now(); return v; }).finally(() => { c.p = null; });
  return c.p;
}
export function invalidar(...partes) { partes.forEach((p) => { if (caches[p]) caches[p].em = 0; }); }

// nome e telefone de quem ficou fora da lista de moedas/indicações: cópia do app guardada pela Fila de montagem (sorelly.preferencia_app);
// quem não estiver lá é lido no app (/revendedoras/kit-preferences/:id, o mesmo do antigo), 6 por vez, guardado 30 min. Falha só deixa sem nome.
const nomesApp = G.__indNomes || (G.__indNomes = new Map());
async function nomesGuardados(ids) {
  const m = new Map();
  if (!ids.length) return m;
  try { const r = await consulta("select id, nome, coalesce(telefone, '') as telefone from sorelly.preferencia_app where id = any($1::int[])", [ids]); r.rows.forEach((x) => m.set(Number(x.id), x)); }
  catch (x) { /* tabela da Fila de montagem ainda não existe */ }
  const falta = ids.filter((id) => !m.has(id)).slice(0, 60);
  let i = 0;
  const trilha = async () => {
    while (i < falta.length) {
      const id = falta[i++], c = nomesApp.get(id);
      if (c && Date.now() - c.em < 30 * 60000) { if (c.v) m.set(id, c.v); continue; }
      let v = null;
      try { const { status, j } = await app("GET", "/revendedoras/kit-preferences/" + id); if (status === 200 && j && typeof j.nome === "string") v = { id, nome: texto(j.nome), telefone: texto(j.telefone) }; } catch (x) { v = null; }
      nomesApp.set(id, { v, em: Date.now() }); if (v) m.set(id, v);
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, falta.length) }, trilha));
  return m;
}

// ---------- estado no formato das telas (domain/indicacoes.js) ----------
// o = {forcar, arquivoVersao (a tela já tem essa versão da planilha: não manda de novo), soAbertos (Agendamento: só pedidos em aberto)}
export async function montarEstado(o = {}) {
  await garantirTabelas();
  await ponteAutomatica();
  const forcar = !!o.forcar;
  const [resgates, funil, ranking] = await Promise.all([
    emCache("resgates", resgatesDoApp, forcar),
    o.soAbertos ? Promise.resolve([]) : emCache("funil", funilDoApp, forcar),
    o.soAbertos ? Promise.resolve([]) : emCache("ranking", rankingDoApp, forcar),
  ]);
  const listaRes = o.soAbertos ? resgates.filter((r) => r.status === "solicitado" || r.status === "aprovado") : resgates;
  const balcao = await lerBalcao(listaRes.map((r) => r.id));

  // revendedoras: ranking (moedas e indicações) + quem aparece no funil + quem tem pedido
  const revs = new Map(ranking.map((r) => [r.id, { id: r.id, nome: r.nome, telefone: r.telefone, email: r.email, origem: "app", criadoEm: "", moedas: r.moedas, indicacoesApp: r.indicacoesApp }]));
  for (const i of funil) { const rv = i.revendedora; if (rv.id != null && !revs.has(rv.id)) revs.set(rv.id, { id: rv.id, nome: rv.nome, telefone: rv.telefone, email: rv.email, origem: "app", criadoEm: "", moedas: 0, indicacoesApp: 0 }); }
  const semNome = [...new Set(listaRes.map((r) => r.userId).filter((id) => id != null && !revs.has(id)))];
  const guardados = await nomesGuardados(semNome);
  for (const id of semNome) { const g = guardados.get(id); revs.set(id, { id, nome: g ? g.nome : "", telefone: g ? g.telefone : "", email: "", origem: "app", criadoEm: "", moedas: 0, indicacoesApp: 0 }); }

  // catálogo de prêmios (o mesmo para todas; lido com a primeira revendedora da lista)
  let premios = [];
  try {
    const alguem = (ranking[0] && ranking[0].id) || semNome[0] || (listaRes[0] && listaRes[0].userId);
    if (alguem) premios = await emCache("premios", () => premiosDoApp(alguem).then((x) => { if (!x) throw erroHttp("prêmios", 503); return x.premios.map((p) => ({ codigo: p.codigo, titulo: p.titulo, custoMoedas: p.custoMoedas, valor: p.valor })); }), false);
  } catch (x) { premios = []; }

  const resgatesTela = listaRes.map((r) => ({
    id: r.id, revendedoraId: r.userId, premioCodigo: r.premioCodigo, premioTitulo: r.premioTitulo, premioValor: r.premioValorCentavos / 100, custoMoedas: r.custoMoedas, etapa: r.status,
    origem: "app", debitou: true, criadoEm: paraSP(r.criadoEm), aprovadoEm: null, entregueEm: paraSP(r.entregueEm), canceladoEm: paraSP(r.canceladoEm), canceladoMotivo: r.canceladoMotivo,
    retiradaEm: r.retiradaEm, operacao: opDaLinha(balcao.get(r.id)), historico: [],
  }));

  let indicacoesTela = [], extrato = [];
  if (!o.soAbertos) {
    await completarMotivos(funil.filter((i) => i.status === "cancelado" && i.leadId).map((i) => i.leadId));
    indicacoesTela = funil.map((i) => {
      const criado = paraSP(i.criadoEm), mudou = paraSP(i.statusAlteradoEm) || criado;
      const hist = [{ em: criado, por: "app", de: null, para: "criado", nota: "" }];
      if (i.status !== "criado") hist.push({ em: mudou, por: "app", de: null, para: i.status, nota: "" });
      return { id: i.id, revendedoraId: i.revendedora.id, indicadaNome: i.indicada.nome, indicadaWhatsapp: i.indicada.whatsapp, cidade: "", cep: "", endereco: "", numero: "",
        form: { situacao: "" }, profissao: "", empresa: "", tempoAtuacao: "", enderecoEmpresa: "", observacao: "", etapa: i.status, etapaAntesCancelar: null,
        motivoReprovacao: i.status === "cancelado" && i.leadId ? ((motivos.get(i.leadId) || {}).motivo || null) : null,
        moedasCreditadas: i.moedasCreditadas, creditadoEm: paraSP(i.creditadoEm), criadoEm: criado, etapaAlteradaEm: mudou, origem: "app", leadId: i.leadId, historico: hist };
    });
    // movimentos de moedas que se conhece daqui (o extrato completo, com créditos manuais e vencimentos, fica no app)
    for (const i of indicacoesTela) if (i.moedasCreditadas > 0) extrato.push({ id: "i" + i.id, revendedoraId: i.revendedoraId, tipo: "indicacao", moedas: i.moedasCreditadas, motivo: "Kit entregue: " + (i.indicadaNome || "indicação #" + i.id), em: i.creditadoEm || i.etapaAlteradaEm, por: "app", ref: { indicacaoId: i.id } });
    for (const r of resgatesTela) {
      extrato.push({ id: "r" + r.id, revendedoraId: r.revendedoraId, tipo: "resgate", moedas: -r.custoMoedas, motivo: "Pedido #" + r.id + ": " + r.premioTitulo, em: r.criadoEm, por: "app", ref: { resgateId: r.id } });
      if (r.etapa === "cancelado") extrato.push({ id: "e" + r.id, revendedoraId: r.revendedoraId, tipo: "estorno", moedas: r.custoMoedas, motivo: "Pedido #" + r.id + " cancelado" + (r.canceladoMotivo ? ": " + r.canceladoMotivo : ""), em: r.canceladoEm, por: "app", ref: { resgateId: r.id } });
    }
  }

  // planilha antiga: só manda se a tela ainda não tem esta versão
  let arquivo = [], av = "";
  if (!o.soAbertos) {
    av = await versaoArquivo();
    arquivo = o.arquivoVersao && o.arquivoVersao === av && av !== "0|" ? null : await lerArquivo();
  }
  const ultimo = Math.max(...["resgates", "funil", "ranking"].map((p) => (caches[p] && caches[p].em) || 0));
  return {
    ind: { v: 1, seq: 0, aoVivo: true, soAbertos: !!o.soAbertos, lidoEm: ultimo ? paraSP(new Date(ultimo)) : paraSP(new Date()), arquivoVersao: av,
      gravacao: { app: gravaApp(), kommo: gravaKommo() }, premios, revendedoras: [...revs.values()], indicacoes: indicacoesTela, resgates: resgatesTela, extrato, arquivo },
  };
}

// ---------- busca de revendedora (crédito, pedido no balcão, indicação manual) ----------
// app primeiro (todas as revendedoras, não só as do ranking); se o app não achar ou estiver fora, a lista da DevMaster (sem saldo de moedas).
export async function buscarRevendedoras(busca) {
  const q = texto(busca);
  if (q.length < 2) return { itens: [], fonte: null };
  let doApp = null;
  try {
    const { status, j } = await app("GET", "/admin/indicacoes/revendedoras?page=1&pageSize=20&busca=" + encodeURIComponent(q));
    if (status === 200 && j && Array.isArray(j.items)) doApp = j.items.filter((x) => typeof x?.id === "number").map((x) => ({ id: x.id, nome: texto(x.nome), telefone: texto(x.telefone), email: texto(x.email), moedas: Number(x.moedas) || 0, indicacoesApp: Number(x.indicacoes) || 0, origem: "app" }));
  } catch (x) { doApp = null; }
  if (doApp && doApp.length) return { itens: doApp, fonte: "app" };
  try {
    const lista = await listaDevmaster(), alvo = norm(q), dg = digitos(q), soDig = /^\d+$/.test(q);
    const achadas = lista.filter((r) => {
      if (soDig && dg.length <= 6 && String(Number(r.codigo)) === String(Number(dg))) return true;
      if (norm(r.nome).includes(alvo) || norm(r.email).includes(alvo)) return true;
      return dg.length >= 3 && (digitos(r.celular).includes(dg) || digitos(r.documento).includes(dg));
    }).slice(0, 20);
    return { itens: achadas.map((r) => ({ id: Number(r.codigo), nome: r.nome, telefone: r.celular, email: r.email, moedas: null, indicacoesApp: null, origem: "devmaster" })).filter((r) => Number.isInteger(r.id) && r.id > 0), fonte: "devmaster" };
  } catch (x) { return { itens: doApp || [], fonte: doApp ? "app" : null }; }
}
// dados da indicadora para o lead da Kommo: app primeiro, DevMaster depois (lá tem o CPF)
async function revendedoraPorId(id) {
  try {
    const { status, j } = await app("GET", "/revendedoras/kit-preferences/" + encodeURIComponent(String(id)));
    if (status === 200 && j && typeof j.id === "number") return { id: j.id, nome: texto(j.nome), telefone: texto(j.telefone), email: texto(j.email), cpf: "" };
  } catch (x) { /* tenta a DevMaster */ }
  try {
    const r = (await listaDevmaster()).find((x) => String(Number(x.codigo)) === String(Number(id)));
    if (r) return { id: Number(r.codigo), nome: r.nome, telefone: r.celular, email: r.email, cpf: r.documento };
  } catch (x) { /* sem DevMaster */ }
  return null;
}

// ---------- ações (mesmas "op" do domain/indicacoes.js; as telas não mudam) ----------
const ehDia = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
const minutos = (hm) => { const m = /^(\d{2}):(\d{2})$/.exec(String(hm || "")); return m ? +m[1] * 60 + +m[2] : null; };
const horarioValido = (hm) => { const n = minutos(hm); return n != null && n >= HORA_INICIO && n <= HORA_FIM && (n - HORA_INICIO) % PASSO === 0; };
const formatarDia = (dia) => dia.slice(8, 10) + "/" + dia.slice(5, 7) + "/" + dia.slice(0, 4);
const reais = (c) => "R$ " + (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moedasTxt = (n) => Number(n).toLocaleString("pt-BR") + (Number(n) === 1 ? " moeda" : " moedas");
const idsJuntos = (a) => [...new Set([a.id, ...(Array.isArray(a.juntos) ? a.juntos : [])].map(Number).filter((n) => Number.isInteger(n) && n > 0))];

async function patchResgate(id, corpo) {
  const { status, j } = await app("PATCH", "/admin/indicacoes/resgates/" + encodeURIComponent(String(id)), corpo);
  if (status === 404) throw erroHttp("Pedido #" + id + " não encontrado no app.", 404);
  if (status === 409) throw erroHttp("O pedido #" + id + " já mudou de etapa. Atualize a tela e tente de novo.", 409);
  if (status === 400) throw erroHttp(msgDe(j, "O app recusou a mudança do pedido #" + id + "."), 400);
  if (status !== 200) throw erroHttp("Não foi possível atualizar o pedido #" + id + " no app (" + status + ").", 503);
  return { estornou: !!(j && j.estornou === true), saldoMoedas: j ? numero(j.saldoMoedas) : null };
}

async function agendar(a, por) {
  const dia = a.iso ? String(a.iso).slice(0, 10) : a.dia, hor = a.iso ? String(a.iso).slice(11, 16) : a.horario, hoje = hojeSP();
  if (!ehDia(dia)) throw erroHttp("Escolha o dia da retirada.", 400);
  if (dia < somaDias(hoje, -DIAS_RETROATIVOS)) throw erroHttp("A data da retirada pode voltar no máximo " + DIAS_RETROATIVOS + " dias.", 400);
  if (!horarioValido(hor)) throw erroHttp("Escolha um horário entre 08:00 e 18:00, de 30 em 30 minutos.", 400);
  const ids = idsJuntos(a), pedidos = [];
  for (const id of ids) {
    const r = await resgateDoApp(id);
    if (r.status !== "solicitado" && r.status !== "aprovado") throw erroHttp("O pedido #" + id + " já foi " + (r.status === "entregue" ? "retirado." : "cancelado."), 409);
    pedidos.push(r);
  }
  if (pedidos.some((r) => r.status === "solicitado")) exigeApp();
  for (const r of pedidos) {
    await salvarBalcao(r.id, { dataAgendada: dia + "T" + hor + ":00" }, por);
    if (r.status === "solicitado") await patchResgate(r.id, { status: "aprovado", retiradaEm: dia });
  }
  const n = pedidos.length, passou = dia < hoje;
  return (passou ? "Retirada registrada em " : pedidos.every((r) => r.status === "aprovado") ? "Reagendado: " : "Retirada agendada: ") + formatarDia(dia) + " às " + hor + (n > 1 ? " (" + n + " pedidos juntos)." : ".");
}

async function entregar(a, por) {
  const cod = normalizarCodigosPecas(a.codigosPecas), totalC = centavos(a.valorVenda == null || a.valorVenda === "" ? null : a.valorVenda, "Valor em venda");
  if (!cod.length) throw erroHttp("Informe as peças retiradas antes de confirmar.", 400);
  if (totalC == null || totalC <= 0) throw erroHttp("Informe o valor em venda das peças antes de confirmar.", 400);
  if (a.revendedoraConfirmou !== true) throw erroHttp("Confirme que a revendedora conferiu as peças.", 400);
  exigeApp();
  const ids = idsJuntos(a), pedidos = [];
  for (const id of ids) {
    const r = await resgateDoApp(id);
    if (r.status === "entregue" || r.status === "cancelado") throw erroHttp("O pedido #" + id + " já foi " + (r.status === "entregue" ? "retirado." : "cancelado."), 409);
    pedidos.push(r);
  }
  const principal = pedidos[0];
  if (principal.status !== "aprovado") throw erroHttp("Agende a retirada do pedido #" + principal.id + " antes de confirmar.", 400);
  // retirada junto: os outros pedidos da mesma visita recebem as mesmas peças e o valor dividido na proporção do prêmio (os centavos que sobram ficam no primeiro)
  const soma = pedidos.reduce((t, r) => t + (r.premioValorCentavos || 0), 0), partes = pedidos.map((r) => (pedidos.length === 1 ? totalC : soma > 0 ? Math.floor(totalC * (r.premioValorCentavos || 0) / soma) : Math.floor(totalC / pedidos.length)));
  partes[0] += totalC - partes.reduce((t, x) => t + x, 0);
  const visita = (await lerBalcao([principal.id])).get(principal.id), diaVisita = visita && visita.dataAgendada ? paraSP(visita.dataAgendada) : paraSP(new Date());
  for (let k = 0; k < pedidos.length; k++) {
    const r = pedidos[k], obsBase = k === 0 ? a.observacao : [texto(a.observacao || ""), "Retirada junto com o pedido #" + principal.id + " (mesmas peças, valor dividido)"].filter(Boolean).join(" · ");
    const dados = { codigosPecas: cod, valorVenda: partes[k] / 100, responsavelNome: a.responsavelNome !== undefined ? a.responsavelNome : undefined, observacao: obsBase !== undefined ? obsBase : undefined };
    if (k === 0 && a.valorDiferencaBrinde !== undefined) dados.valorDiferencaBrinde = a.valorDiferencaBrinde || null;
    // brindes retirados da maleta (27/11/2026): marcado na confirmação, vale para todos os pedidos da mesma visita
    if (a.retiradaMaleta !== undefined) { dados.retiradaMaleta = !!a.retiradaMaleta; if (a.retiradaMaleta) { dados.dataAcertoMaleta = a.dataAcertoMaleta || null; dados.representanteMaleta = a.representanteMaleta || null; } }
    if (r.status === "solicitado") { await salvarBalcao(r.id, { dataAgendada: diaVisita.slice(0, 16) }, por); await patchResgate(r.id, { status: "aprovado", retiradaEm: diaVisita.slice(0, 10) }); }
    await salvarBalcao(r.id, dados, por);
    await patchResgate(r.id, { status: "entregue" });
  }
  return "Retirada confirmada: " + (pedidos.length > 1 ? pedidos.length + " pedidos" : principal.premioTitulo) + " (" + reais(totalC) + ").";
}

async function corrigirEtapa(a, por) {
  const id = Number(a.id);
  if (!Number.isInteger(id) || id <= 0) throw erroHttp("Indicação inválida.", 400);
  let para = a.etapa;
  if (a.op === "ind_avancar" || a.op === "ind_voltar") {
    const i = ((await emCache("funil", funilDoApp, false)) || []).find((x) => x.id === id);
    if (!i) throw erroHttp("Indicação não encontrada. Atualize a tela.", 404);
    const k = ORDEM_FUNIL.indexOf(i.status);
    para = a.op === "ind_avancar" ? (i.status === "cancelado" ? null : ORDEM_FUNIL[k + 1] || null) : (i.status === "cancelado" ? "em_andamento" : k > 0 ? ORDEM_FUNIL[k - 1] : null);
    if (!para) throw erroHttp(a.op === "ind_avancar" ? "Já está no último passo." : "Já está no primeiro passo.", 400);
  }
  if (para === "criado") throw erroHttp("\"Novas\" não é etapa de destino: escolha Em andamento.", 400);
  if (!ETAPAS_FUNIL.includes(para)) throw erroHttp("Etapa desconhecida.", 400);
  exigeApp();
  const motivo = texto(String(a.motivo || a.motivoReprovacao || a.nota || "")).slice(0, 200);
  const { status, j } = await app("PATCH", "/admin/indicacoes/" + id + "/status", { status: para, creditarMoedas: a.creditarMoedas !== false, operador: String(por || "").slice(0, 120), motivo: motivo || undefined });
  if (status === 404 && /route/i.test(texto(j && j.message))) throw erroHttp("O app ainda não tem a correção de etapa publicada.", 503);
  if (status === 404) throw erroHttp(msgDe(j, "Indicação não encontrada no app."), 404);
  if (status === 409) throw erroHttp(msgDe(j, "Esta indicação já está como Kit entregue e não pode mudar."), 409);
  if (status === 400 || status === 422) throw erroHttp(msgDe(j, "Etapa inválida para esta indicação."), 400);
  if (status !== 200) throw erroHttp("Não foi possível mudar a etapa no app (" + status + ").", 503);
  const cred = j ? numero(j.moedasCreditadas) : null;
  return "Indicação #" + id + ": " + ROTULO_FUNIL[para] + (para === "finalizado" && cred > 0 ? " · " + moedasTxt(cred) + " creditadas." : ".");
}

// caminho profissional do formulário → campos da Kommo (mesma regra do sorelly-forms e do antigo)
function caminho(f) {
  const t = (v) => texto(String(v || "")), sit = f.situacao || f.trabalhaAtualmente || "nao";
  if (sit === "sim") return { profissao: t(f.cargo), empresa: t(f.nomeEmpresa), tempo: t(f.tempoAtuacaoEmpresa), enderecoEmpresa: [t(f.enderecoEmpresa), t(f.numeroEmpresa), t(f.cidadeEmpresa) ? "- " + t(f.cidadeEmpresa) : ""].filter(Boolean).join(", ").replace(", -", " -"), obs: "Caminho: empresa" };
  if (sit === "autonoma") return { profissao: t(f.areaAutonoma), empresa: "", tempo: t(f.tempoAutonoma), enderecoEmpresa: "", obs: "Caminho: autônoma" };
  const curso = f.estudaGraduacao === "sim" ? t(f.cursoGraduacao) : "";
  return { profissao: curso || "Não trabalha", empresa: "", tempo: "", enderecoEmpresa: "", obs: ["Caminho: não trabalha", curso ? "Graduação: " + curso : ""].filter(Boolean).join(" | ") };
}
async function avisarApp(corpo) {
  const { status, j } = await app("POST", "/admin/indicacoes", corpo);
  if ((j && j.code === "whatsapp_ja_indicado") || (status === 409 && !(j && j.code === "limite_indicacoes_atingido"))) throw erroHttp(msgDe(j, "Este WhatsApp já foi indicado antes."), 409);
  if (status === 409) throw erroHttp(msgDe(j, "Esta revendedora chegou ao limite de indicações válidas."), 409);
  if (status === 404) throw erroHttp(msgDe(j, "Revendedora não encontrada no app."), 404);
  if (status === 400) throw erroHttp(msgDe(j, "Dados inválidos para registrar a indicação."), 400);
  if (status !== 200 || (j && j.ok === false)) throw erroHttp(msgDe(j, "Não foi possível registrar a indicação no app."), 503);
  return { indicacaoId: j ? numero(j.indicacaoId) : null };
}
// os mesmos obrigatórios do admin antigo (CriarIndicacaoManualBodySchema) e do sorelly-forms: o lead não nasce incompleto na Kommo. Devolve o texto do que falta ou "".
export function faltaNaIndicacao(a) {
  const t = (v) => texto(String(v == null ? "" : v)), f = a.form || {}, sit = f.situacao || "nao";
  if (t(a.nome).length < 2) return "Informe o nome da indicada.";
  if (digitos(a.whatsapp).length < 10) return "WhatsApp inválido: informe o DDD e o número.";
  if (!t(a.cidade)) return "Informe a cidade da indicada.";
  if (digitos(a.cep).length < 8) return "Informe o CEP da indicada (8 números).";
  if (!t(a.endereco)) return "Informe o endereço da indicada.";
  if (!t(a.numero)) return "Informe o número da casa da indicada.";
  if (!["sim", "nao", "autonoma"].includes(sit)) return "Informe a situação de trabalho.";
  if (sit === "sim") { if (!t(f.nomeEmpresa)) return "Informe o nome da empresa."; if (!t(f.cargo)) return "Informe o cargo."; if (!t(f.enderecoEmpresa)) return "Informe o endereço da empresa."; if (!t(f.tempoAtuacaoEmpresa)) return "Informe o tempo na empresa."; }
  if (sit === "autonoma") { if (!t(f.areaAutonoma)) return "Informe a área de atuação."; if (!t(f.tempoAutonoma)) return "Informe o tempo como autônoma."; }
  if (sit === "nao" && f.estudaGraduacao === "sim" && !t(f.cursoGraduacao)) return "Informe o curso de graduação.";
  return "";
}
// Indicação manual: (1) app "criado" (para se o WhatsApp já foi indicado) → (2) contato e lead na Kommo → (3) app "em_andamento" com o lead → (4) dados da indicadora no lead
async function indicacaoManual(a, por) {
  const revId = Number(a.revendedoraId);
  if (!Number.isInteger(revId) || revId <= 0) throw erroHttp("Escolha a revendedora que indicou (busque pelo nome, telefone ou número).", 400);
  const nome = texto(String(a.nome != null ? a.nome : a.indicadaNome || "")), dg = digitos(a.whatsapp != null ? a.whatsapp : a.indicadaWhatsapp);
  const falta = faltaNaIndicacao(Object.assign({}, a, { nome, whatsapp: dg }));
  if (falta) throw erroHttp(falta, 400);
  exigeApp();
  if (!gravaKommo()) throw erroHttp("A indicação manual cria o lead na Kommo, e a gravação na Kommo está desligada neste servidor (variável INDICACOES_KOMMO_GRAVAR=1 liga). Nada foi gravado.", 503);
  const whatsapp = "+" + (dg.startsWith("55") ? dg : "55" + dg), f = Object.assign({}, a.form || {}), c = caminho(f);
  const criado = await avisarApp({ revendedoraId: revId, status: "criado", whatsapp, nome });
  let contactId = null;
  try { const r = await kommo("POST", "/api/v4/contacts", [{ name: nome, custom_fields_values: [{ field_id: KOMMO.phoneFieldId, field_code: "PHONE", values: [{ value: whatsapp }] }] }]); contactId = r.status === 200 && r.j ? (r.j._embedded?.contacts?.[0]?.id ?? null) : null; }
  catch (x) { console.error("[indicacoes] contato Kommo falhou; segue sem vínculo"); }
  const obs = ["Origem: admin", c.obs, texto(String(a.observacao || ""))].filter(Boolean).join(" | ");
  const campos = [[KOMMO.campos.nome, nome], [KOMMO.campos.cidade, texto(a.cidade)], [KOMMO.campos.endereco, [texto(a.endereco), texto(a.numero)].filter(Boolean).join(", ")], [KOMMO.campos.cep, texto(a.cep)],
    [KOMMO.campos.profissao, c.profissao], [KOMMO.campos.empresa_nome, c.empresa], [KOMMO.campos.empresa_tempo_atuacao, c.tempo], [KOMMO.campos.empresa_endereco, c.enderecoEmpresa], [KOMMO.campos.observacoes, obs]]
    .filter(([, v]) => v !== "" && v != null).map(([field_id, value]) => ({ field_id, values: [{ value }] }));
  let leadId = null;
  try {
    const r = await kommo("POST", "/api/v4/leads", [{ name: nome, status_id: KOMMO.statusSetorCadastro, pipeline_id: KOMMO.pipelineId, custom_fields_values: campos, _embedded: { tags: [KOMMO.tagIndicacao], ...(contactId != null ? { contacts: [{ id: contactId }] } : {}) } }]);
    leadId = r.status === 200 && r.j ? (r.j._embedded?.leads?.[0]?.id ?? null) : null;
  } catch (x) { leadId = null; }
  if (typeof leadId !== "number") throw erroHttp("A indicação foi registrada no app, mas a Kommo não criou o lead. Tente de novo ou avise o time.", 502);
  try { await avisarApp({ revendedoraId: revId, status: "em_andamento", whatsapp, nome, leadId }); } catch (x) { console.error("[indicacoes] indicação criada, mas não passou para em_andamento", leadId); }
  const rv = await revendedoraPorId(revId), extras = [[KOMMO.indicadora.idRevendedora, revId], [KOMMO.indicadora.nome, rv && rv.nome], [KOMMO.indicadora.telefone, rv && rv.telefone], [KOMMO.indicadora.email, rv && rv.email], [KOMMO.indicadora.cpf, rv && rv.cpf]]
    .filter(([, v]) => v !== "" && v != null).map(([field_id, value]) => ({ field_id, values: [{ value }] }));
  try { await kommo("PATCH", "/api/v4/leads", [{ id: leadId, custom_fields_values: extras, _embedded: { tags: [KOMMO.tagIndicacao] } }]); } catch (x) { console.error("[indicacoes] dados da indicadora não foram para o lead", leadId); }
  return nome + " indicada" + (rv && rv.nome ? " por " + rv.nome : "") + ". Lead " + leadId + " criado na Kommo" + (criado.indicacaoId ? " (indicação #" + criado.indicacaoId + ")." : ".");
}

// a = {op, ...} (o mesmo objeto das telas); devolve a mensagem para o aviso. Erro = Error com statusCode.
export async function executarAcao(a, eu) {
  const por = (eu && (eu.nome || eu.email)) || "—";
  if (!a || typeof a.op !== "string") throw erroHttp("Ação inválida.", 400);
  switch (a.op) {
    case "resgate_set": {   // dados de balcão: só o banco deste sistema, nunca a etapa
      await salvarBalcao(a.id, a, por); invalidar("resgates");
      return "Dados do balcão salvos.";
    }
    case "resgate_agendar": { const m = await agendar(a, por); invalidar("resgates"); return m; }
    case "resgate_entregar": { const m = await entregar(a, por); invalidar("resgates", "ranking"); return m; }
    case "resgate_cancelar": {
      const mot = texto(String(a.motivo || ""));
      if (!mot) throw erroHttp("Diga o motivo do cancelamento.", 400);
      if (mot.length > 500) throw erroHttp("O motivo é grande demais.", 400);
      exigeApp();
      const r = await resgateDoApp(a.id);
      if (r.status !== "solicitado" && r.status !== "aprovado") throw erroHttp("Esse pedido já foi " + (r.status === "entregue" ? "retirado." : "cancelado."), 409);
      const x = await patchResgate(r.id, { status: "cancelado", motivo: mot });
      invalidar("resgates", "ranking");
      return "Pedido #" + r.id + " cancelado" + (x.estornou ? " · " + moedasTxt(r.custoMoedas) + " devolvidas" + (x.saldoMoedas != null ? " (saldo " + moedasTxt(x.saldoMoedas) + ")." : ".") : ".");
    }
    case "resgate_add": {   // pedido no balcão: o app debita na hora e abre em "Na fila"
      const revId = Number(a.revendedoraId), cod = texto(String(a.premioCodigo || ""));
      if (!Number.isInteger(revId) || revId <= 0) throw erroHttp("Escolha a revendedora (ela precisa ter cadastro no app).", 400);
      if (!cod) throw erroHttp("Escolha o prêmio.", 400);
      exigeApp();
      const { status, j } = await app("POST", "/admin/indicacoes/resgates", { revendedoraId: revId, premioCodigo: cod });
      if (status === 404) throw erroHttp(msgDe(j, "Revendedora não encontrada no app."), 404);
      if (status === 400 || status === 422) throw erroHttp(msgDe(j, "O app recusou o pedido."), 400);
      if (status === 409) throw erroHttp(j && numero(j.saldoMoedas) != null && numero(j.custoMoedas) != null ? "Saldo insuficiente. Ela tem " + moedasTxt(j.saldoMoedas) + "; o prêmio custa " + moedasTxt(j.custoMoedas) + "." : msgDe(j, "Saldo insuficiente."), 409);
      if (status !== 201 && status !== 200) throw erroHttp("Não foi possível criar o pedido no app (" + status + ").", 503);
      const novo = lerResgate((j && j.resgate) || j);
      if (novo && (texto(a.observacao || "") || texto(a.responsavelNome || ""))) await salvarBalcao(novo.id, { observacao: a.observacao || undefined, responsavelNome: a.responsavelNome || undefined }, por);
      invalidar("resgates", "ranking");
      return "Pedido" + (novo ? " #" + novo.id : "") + " criado" + (novo ? ": " + novo.premioTitulo + " (" + moedasTxt(novo.custoMoedas) + " debitadas)." : ".");
    }
    case "moedas_credito": {
      const revId = Number(a.revendedoraId), mo = Number(a.moedas), mot = texto(String(a.motivo || ""));
      if (!Number.isInteger(revId) || revId <= 0) throw erroHttp("Escolha a revendedora.", 400);
      if (!Number.isInteger(mo) || mo < MOEDAS_MIN || mo > MOEDAS_MAX) throw erroHttp("Informe um número inteiro de moedas entre 1 e 100.000.", 400);
      if (mot.length > MOTIVO_MOEDAS_MAX) throw erroHttp("O motivo passou de " + MOTIVO_MOEDAS_MAX + " caracteres.", 400);
      exigeApp();
      const { status, j } = await app("POST", "/admin/indicacoes/revendedoras/" + revId + "/moedas", { moedas: mo, motivo: mot || undefined, operador: String(por).slice(0, 60) });
      if (status === 404) throw erroHttp(msgDe(j, "Revendedora não encontrada no app."), 404);
      if (status === 400 || status === 422) throw erroHttp(msgDe(j, "O app recusou o crédito."), 400);
      if (status !== 200) throw erroHttp("Não foi possível creditar as moedas no app (" + status + ").", 503);
      invalidar("ranking");
      return moedasTxt(mo) + " creditadas" + (j && numero(j.saldo) != null ? ". Saldo: " + moedasTxt(j.saldo) + "." : ".");
    }
    case "ind_etapa": case "ind_avancar": case "ind_voltar": { const m = await corrigirEtapa(a, por); invalidar("funil", "ranking"); return m; }
    case "ind_add": { const m = await indicacaoManual(a, por); invalidar("funil", "ranking"); return m; }
    default:
      throw erroHttp("Com as Indicações ligadas ao app, isto não se faz por aqui: prêmios, cadastro da revendedora, edição da indicada e extrato ficam no app.", 400);
  }
}
