// Aprovação de cadastros AO VIVO (25/11/2026, pedido do Leonardo: "trazer tudo do cadastro do admin antigo, ligado na Kommo, com as imagens").
//
// De onde vêm os dados: o backend do admin antigo continua recebendo a Kommo (webhook → fila SQS → ingestão) e guardando os leads na tabela
// kommo_lead e as fotos (Instagram, Instagram Pro, casa) no CDN público (cdn.sorellyjoias.com.br), tabela kommo_lead_image. Este sistema LÊ esse
// banco (ADMIN_ANTIGO_DATABASE_URL) e mostra tudo nas telas do Cadastro de revendedoras.
// Decisão (aprovar, reprovar, desfazer): igual ao ReviewKommoLead/ReopenKommoLead do antigo, na mesma ordem:
//   1. marca lastOutboundWriteAt (o webhook do antigo ignora o eco da nossa própria gravação por 10 s);
//   2. grava na Kommo (etapa 142 aprovada / 143 reprovada / 109136451 análise + campos "Resp. Análise", "Kit novo", opção e valores do kit, "Reprovada");
//      se a Kommo recusar, nada muda aqui (erro 502);
//   3. grava no banco antigo só se o lead ainda estiver como estava (outra pessoa decidiu antes = 409);
//   4. resolve os avisos do sino do antigo (notificacao). O kit novo NÃO é criado no banco antigo: os Kits novos deste sistema vêm da Kommo
//      (src/server/kits-novos-kommo.js) quando o lead entra no funil Aprovadas.
// O alerta de WhatsApp de pendentes e o relatório diário de origem (lambdas do antigo) seguem funcionando: leem as mesmas colunas.
// SEGURANÇA: o .env local aponta para produção. Decidir só com CADASTRO_GRAVAR=1 no servidor.
import pg from "pg";
import { kommoEnviar, kommoGet, kommoLigada } from "./kommo.js";

const ANALISE = 109136451, APROVADO = 142, REPROVADO = 143;
const F = { respAnalise: 2091084, kitNovo: 2075060, kitOpcao: 2104504, kitCasa: 2104506, kitEmpresa: 2104508, reprovada: 1716048, desqualificada: 1309926,
  obs: 2075024, indicadoraId: 2083841, indicadoraNome: 2083843, indicadoraTel: 2083845 };
const ROTULO_FOTO = { instagram: "Instagram", instagram_pro: "Instagram Pro", imovel: "Casa/Apartamento" };
const ORDEM_FOTO = ["instagram", "instagram_pro", "imovel"];
const KIT_ROTULO = { kit_normal: "Kit normal", kit_normal_expositor: "Kit normal + expositor", vir_empresa: "Vir na empresa", vir_empresa_expositor: "Vir na empresa + expositor" };
// "Resp. Análise" na Kommo (mesmo mapa do antigo: config/kommo-lead-review.ts)
const RESP_POR_LOGIN = { marcushess: "Marcus", nickolasleal: "Nickolas", administrativo: "Lucas" };

export const cadastroLigado = () => { const u = String(process.env.ADMIN_ANTIGO_DATABASE_URL || "").trim(); return !!u && u !== String(process.env.DATABASE_URL || "").trim(); };
export const cadastroGrava = () => process.env.CADASTRO_GRAVAR === "1" && kommoLigada();
const erroHttp = (msg, statusCode, extra) => Object.assign(new Error(msg), { statusCode }, extra || {});

function antigo() {
  if (!cadastroLigado()) throw erroHttp("Ligação com o admin antigo desligada: falta ADMIN_ANTIGO_DATABASE_URL no servidor.", 503);
  if (!globalThis.__cadAntigo) globalThis.__cadAntigo = new pg.Pool({ connectionString: process.env.ADMIN_ANTIGO_DATABASE_URL.trim(), max: 3, ssl: { rejectUnauthorized: true } });
  return globalThis.__cadAntigo;
}

// data/hora no fuso de São Paulo, como as telas usam ("2026-11-25T14:30:05"). As colunas do antigo são timestamp sem fuso, gravadas em UTC.
const COLUNAS = (SPf) => `id, "kommoName", nome, cidade, endereco, cep, profissao, "empresaNome", "empresaTempoAtuacao", "empresaEndereco", observacoes, tags, desempenho,
        "reviewStatus"::text as "reviewStatus", "reviewedBy", "reviewNote", "kitOpcao"::text as "kitOpcao", "kitValorCasa", "kitValorEmpresa", "statusId",
        ${SPf('"reviewedAt"')} as revisado, ${SPf('"syncedAt"')} as entrou, ${SPf('"kommoCreatedAt"')} as criado, ${SPf('"kommoUpdatedAt"')} as atualizado, ${SPf('"conferenciaAt"')} as conferencia,
        "rawPayload"->'custom_fields_values' as cf, "rawPayload"#>'{_embedded,tags}' as tg, ("rawPayload"#>>'{_embedded,contacts,0,id}')::bigint as contato`;
const SP = (col) => `to_char((${col} at time zone 'UTC') at time zone 'America/Sao_Paulo', 'YYYY-MM-DD"T"HH24:MI:SS')`;

const valorCampo = (cf, id) => { const f = (cf || []).find((x) => Number(x.field_id) === id); const v = f && f.values && f.values[0] ? f.values[0].value : null; return v == null ? "" : String(v).trim(); };
const soDigitos = (t) => { let d = String(t || "").replace(/\D/g, ""); if (d.length >= 12 && d.startsWith("55")) d = d.slice(2); return d; };
// telefone no próprio lead (campo de telefone/WhatsApp), como o antigo (lib/kommo/phone.ts). O "Número (revendedora)" é da indicadora: fica de fora.
function telefoneDoLead(cf) {
  const f = (cf || []).find((x) => Number(x.field_id) !== F.indicadoraTel && (String(x.field_code || "").toUpperCase() === "PHONE" || /whats|telefone|celular|phone/i.test(String(x.field_name || ""))));
  const v = f && f.values && f.values[0] ? soDigitos(f.values[0].value) : "";
  return v.length >= 10 ? v : "";
}

// lead do banco antigo → formato das telas (domain/cadastro-leads.js, novoLead). completo=false: só o que os relatórios e a lista usam
// (fila e decididos dos últimos 7 dias vão completos; o detalhe de um antigo é buscado ao abrir: buscarLead). Assim a lista cai de 3,5 MB para menos de 1 MB.
function paraTela(r, fotos, tels) {
  const cf = r.cf || [];
  const tagsCol = Array.isArray(r.tags) && r.tags.length ? r.tags : (Array.isArray(r.tg) ? r.tg : []);
  const indNome = valorCampo(cf, F.indicadoraNome), indId = valorCampo(cf, F.indicadoraId), indTel = valorCampo(cf, F.indicadoraTel);
  return {
    id: Number(r.id), nome: String(r.nome || r.kommoName || "Lead " + r.id).replace(/\s+/g, " ").trim(),
    cidade: r.cidade || "", endereco: r.endereco || "", cep: r.cep || "", profissao: r.profissao || "",
    empresa: r.empresaNome || "", empresaTempo: r.empresaTempoAtuacao || "", empresaEndereco: r.empresaEndereco || "",
    observacoes: r.observacoes || valorCampo(cf, F.obs), conferenciaEm: r.conferencia || null,
    telefone: tels[r.id] || telefoneDoLead(cf),
    tags: tagsCol.map((t) => ({ id: t.id != null ? "k" + t.id : null, name: String(t.name || "").trim(), color: t.color || null })).filter((t) => t.name),
    indicadora: indNome || indId ? { nome: indNome || "Revendedora #" + indId, id: indId || null, telefone: soDigitos(indTel) || null } : null,
    desempenho: r.desempenho || "iniciou-análise", criadoEm: String(r.criado || r.entrou || "").slice(0, 10), etapaCriadaEm: "", entrouNaFilaEm: r.entrou || "",
    fotos: ORDEM_FOTO.map((slug) => (fotos[r.id] || {})[slug]).filter(Boolean),
    reviewStatus: r.reviewStatus, reviewedAt: r.revisado || null, reviewedBy: r.reviewedBy || null, reviewNote: r.reviewNote || "",
    kitOpcao: r.kitOpcao ? String(r.kitOpcao).toLowerCase() : null,
    kitValorCasa: r.kitValorCasa != null ? Number(r.kitValorCasa) : null, kitValorEmpresa: r.kitValorEmpresa != null ? Number(r.kitValorEmpresa) : null,
    kommo: { statusId: r.statusId, contato: r.contato || null, atualizadoEm: r.atualizado || null }, completo: true,
  };
}
function enxuto(l) {
  return { id: l.id, nome: l.nome, cidade: l.cidade, profissao: l.profissao, empresa: l.empresa, telefone: l.telefone, tags: l.tags,
    indicadora: l.indicadora ? { nome: l.indicadora.nome } : null, desempenho: l.desempenho, criadoEm: l.criadoEm, etapaCriadaEm: "", entrouNaFilaEm: l.entrouNaFilaEm,
    fotos: [], reviewStatus: l.reviewStatus, reviewedAt: l.reviewedAt, reviewedBy: l.reviewedBy, reviewNote: "", kitOpcao: l.kitOpcao, kitValorCasa: l.kitValorCasa, kitValorEmpresa: l.kitValorEmpresa, completo: false };
}

// telefone dos PENDENTES: o lead da Kommo não traz o número, ele fica no contato. Busca na Kommo e guarda 6 horas.
const telCache = globalThis.__cadTel || (globalThis.__cadTel = new Map());
async function telefonesDosPendentes(linhas) {
  const out = {}, faltam = [];
  linhas.filter((r) => r.reviewStatus === "PENDING" && r.contato).forEach((r) => {
    const c = telCache.get(r.contato);
    if (c && Date.now() - c.em < 6 * 3600000) out[r.id] = c.tel; else faltam.push(r);
  });
  if (!faltam.length || !kommoLigada()) return out;
  try {
    for (let i = 0; i < faltam.length; i += 50) {
      const lote = faltam.slice(i, i + 50);
      const r = await kommoGet("/api/v4/contacts?limit=50&" + lote.map((x) => "filter[id][]=" + x.contato).join("&"));
      const cs = (r.j && r.j._embedded && r.j._embedded.contacts) || [];
      const porId = Object.fromEntries(cs.map((c) => [c.id, c]));
      lote.forEach((x) => {
        const c = porId[x.contato];
        const vals = ((c && c.custom_fields_values) || []).filter((f) => String(f.field_code || "").toUpperCase() === "PHONE").flatMap((f) => f.values || []);
        const tel = vals.map((v) => soDigitos(v.value)).find((t) => t.length >= 10) || "";
        telCache.set(x.contato, { tel, em: Date.now() }); out[x.id] = tel;
      });
    }
  } catch (e) { console.warn("[cadastro] telefones da Kommo: " + e.message); }
  return out;
}

/** Versão da lista (muda quando algum lead muda): a tela pergunta a cada poucos segundos e só baixa tudo de novo quando mudou. */
export async function versaoLeads() {
  const r = await antigo().query(`select count(*)::int n, coalesce(to_char(max("updatedAt"), 'YYYYMMDDHH24MISSMS'), '0') u from kommo_lead`);
  return r.rows[0].n + "-" + r.rows[0].u;
}

/** Todos os leads (fila, decididos e histórico) no formato das telas, com as fotos prontas do CDN. */
export async function listarLeads() {
  const db = antigo();
  const [ls, im] = await Promise.all([
    db.query(`select ${COLUNAS(SP)}, ("reviewStatus" = 'PENDING' or "reviewedAt" > (now() at time zone 'UTC') - interval '7 days') as recente from kommo_lead`),
    db.query(`select "leadId", slug, "urlThumb", "urlCard", "urlFull" from kommo_lead_image where status = 'READY' and "urlFull" is not null`),
  ]);
  const fotos = {};
  im.rows.forEach((f) => { (fotos[f.leadId] = fotos[f.leadId] || {})[f.slug] = { campo: f.slug, rotulo: ROTULO_FOTO[f.slug] || f.slug, url: f.urlFull, card: f.urlCard || f.urlFull, thumb: f.urlThumb || f.urlCard || f.urlFull }; });
  const tels = await telefonesDosPendentes(ls.rows);
  return ls.rows.map((r) => { const l = paraTela(r, fotos, tels); return r.recente ? l : enxuto(l); });
}

/** Um lead completo (detalhe de um cadastro antigo, com fotos e observações). */
export async function buscarLead(id) {
  const lid = Number(id);
  if (!Number.isInteger(lid) || lid <= 0) throw erroHttp("Cadastro inválido.", 400);
  const db = antigo();
  const [ls, im] = await Promise.all([
    db.query(`select ${COLUNAS(SP)} from kommo_lead where id = $1`, [lid]),
    db.query(`select "leadId", slug, "urlThumb", "urlCard", "urlFull" from kommo_lead_image where "leadId" = $1 and status = 'READY' and "urlFull" is not null`, [lid]),
  ]);
  if (!ls.rows[0]) throw erroHttp("Cadastro não encontrado.", 404);
  const fotos = {};
  im.rows.forEach((f) => { (fotos[f.leadId] = fotos[f.leadId] || {})[f.slug] = { campo: f.slug, rotulo: ROTULO_FOTO[f.slug] || f.slug, url: f.urlFull, card: f.urlCard || f.urlFull, thumb: f.urlThumb || f.urlCard || f.urlFull }; });
  return paraTela(ls.rows[0], fotos, {});
}

function respAnalise(eu) {
  const login = String((eu && (eu.email || eu.login)) || "").toLowerCase().split("@")[0];
  if (RESP_POR_LOGIN[login]) return RESP_POR_LOGIN[login];
  const primeiro = String((eu && eu.nome) || "").trim().split(/\s+/)[0];
  return ["Marcus", "Nickolas", "Lucas"].find((n) => n.toLowerCase() === primeiro.toLowerCase()) || null;
}
const reais = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };
const textoReais = (v) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });

async function gravarKommo(id, corpo) {
  const r = await kommoEnviar("PATCH", "/api/v4/leads/" + id, corpo);
  if (r.status < 200 || r.status >= 300) throw erroHttp("A Kommo recusou a gravação (" + r.status + "). Nada mudou.", 502, { kommo: r.j });
}

/**
 * Decide um cadastro. acao = "aprovar" | "reprovar" | "desfazer". Para aprovar: opcao (kit_normal, kit_normal_expositor, vir_empresa, vir_empresa_expositor),
 * valorCasa e valorEmpresa (reais). nota opcional. Devolve o lead já no formato das telas.
 */
export async function decidir(id, { acao, opcao, valorCasa, valorEmpresa, nota } = {}, eu) {
  if (!cadastroGrava()) throw erroHttp("Decidir cadastro grava na Kommo e no admin antigo: o servidor precisa de CADASTRO_GRAVAR=1 (e da Kommo ligada).", 503);
  const lid = Number(id);
  if (!Number.isInteger(lid) || lid <= 0) throw erroHttp("Cadastro inválido.", 400);
  if (!["aprovar", "reprovar", "desfazer"].includes(acao)) throw erroHttp("Ação inválida.", 400);
  const db = antigo();
  const atual = (await db.query(`select id, "reviewStatus"::text as st, "kitOpcao"::text as kit from kommo_lead where id = $1`, [lid])).rows[0];
  if (!atual) throw erroHttp("Cadastro não encontrado.", 404);
  const por = String((eu && (eu.email || eu.login || eu.nome)) || "").trim() || null;
  const resp = respAnalise(eu);

  if (acao === "desfazer") {
    if (atual.st === "PENDING") throw erroHttp("Esse cadastro já está em análise.", 409);
    await db.query(`update kommo_lead set "lastOutboundWriteAt" = now() at time zone 'UTC', "updatedAt" = now() at time zone 'UTC' where id = $1`, [lid]);
    await gravarKommo(lid, atual.kit
      ? { status_id: ANALISE, custom_fields_values: [F.kitOpcao, F.kitCasa, F.kitEmpresa].map((field_id) => ({ field_id, values: null })) }
      : { status_id: ANALISE });
    const u = await db.query(`update kommo_lead set "reviewStatus" = 'PENDING', "statusId" = $2, "reviewedAt" = null, "reviewedBy" = null, "reviewNote" = null,
        "kitOpcao" = null, "kitValorCasa" = null, "kitValorEmpresa" = null, "updatedAt" = now() at time zone 'UTC'
      where id = $1 and "reviewStatus" in ('APPROVED', 'REJECTED')`, [lid, ANALISE]);
    if (!u.rowCount) throw erroHttp("Outra pessoa mexeu nesse cadastro agora. Atualize a tela.", 409);
    return { ok: true };
  }

  if (atual.st !== "PENDING") throw erroHttp("Esse cadastro já foi decidido por outra pessoa. Atualize a tela.", 409);
  const aprovar = acao === "aprovar";
  let kit = null;
  const campos = [];
  if (resp) campos.push({ field_id: F.respAnalise, values: [{ value: resp }] });
  if (aprovar) {
    if (!KIT_ROTULO[opcao]) throw erroHttp("Escolha como ela recebe o kit.", 400);
    const vc = reais(valorCasa), ve = reais(valorEmpresa), naEmpresa = /^vir_empresa/.test(opcao), vale = naEmpresa ? ve : vc;
    kit = { opcao, vc, ve };
    if (vale) campos.push({ field_id: F.kitNovo, values: [{ value: vale }] });
    campos.push({ field_id: F.kitOpcao, values: [{ value: KIT_ROTULO[opcao] }] });
    if (vc) campos.push({ field_id: F.kitCasa, values: [{ value: textoReais(vc) }] });
    if (ve) campos.push({ field_id: F.kitEmpresa, values: [{ value: textoReais(ve) }] });
  } else {
    campos.push({ field_id: F.reprovada, values: [{ enum_id: F.desqualificada }] });
  }
  await db.query(`update kommo_lead set "lastOutboundWriteAt" = now() at time zone 'UTC', "updatedAt" = now() at time zone 'UTC' where id = $1`, [lid]);
  await gravarKommo(lid, { status_id: aprovar ? APROVADO : REPROVADO, custom_fields_values: campos });
  const u = await db.query(`update kommo_lead set "reviewStatus" = $2::text::"KommoLeadReviewStatus", "statusId" = $3, "reviewedAt" = now() at time zone 'UTC', "reviewedBy" = $4, "reviewNote" = $5,
      "kitOpcao" = $6::text::"KommoLeadKitOpcao", "kitValorCasa" = $7, "kitValorEmpresa" = $8, "updatedAt" = now() at time zone 'UTC'
    where id = $1 and "reviewStatus" = 'PENDING'`,
    [lid, aprovar ? "APPROVED" : "REJECTED", aprovar ? APROVADO : REPROVADO, por, String(nota || "").trim() || null, kit ? kit.opcao.toUpperCase() : null, kit ? kit.vc : null, kit ? kit.ve : null]);
  if (!u.rowCount) throw erroHttp("Esse cadastro já foi decidido por outra pessoa. Atualize a tela.", 409);
  // sino do admin antigo: o aviso "Nova revendedora para aprovar" deste lead some (falha aqui não desfaz a decisão)
  await db.query(`update notificacao set "resolvidaEm" = now() at time zone 'UTC' where referencia = $1 and "resolvidaEm" is null`, ["kommo-lead:" + lid]).catch((e) => console.warn("[cadastro] notificacao: " + e.message));
  return { ok: true };
}
