// Fila de montagem e Preferências do kit no servidor (migrados do admin antigo, sorelly-admin, em 18/11/2026).
// Mesmas regras do antigo (docs/modulos/montagem.md e preferencias-kit.md de lá):
//   - Fila: todas as revendedoras do app com o resumo das preferências; "já montado" = montagem concluída DEPOIS da última atualização das preferências.
//   - Registro de montagem: quem montou (lista da equipe), valor do kit, início e término, se usou as preferências. Sem edição nem exclusão (só o valor, pela supervisão).
//   - Bônus por produtividade: por colaboradora + dia + período (manhã 8h–12h, tarde 13h–17h, pelo horário de INÍCIO em Brasília), kit normal × especial,
//     meta, base e extra por kit; fator da avaliação das representantes (< 50% = 0; 50–70% = 0,5; ≥ 70% = 1; sem avaliação = 1).
//   - Configuração pública do formulário (GET /api/kit/preferences): o app da revendedora desenha o formulário a partir dela; só blocos ativos, na ordem.
// As tabelas têm o MESMO formato do admin antigo (sorelly.montagem_kit_registro, montagem_staff, montagem_bonus_config), para a cópia dos dados ser direta
// (scripts/migrar-montagem-admin-antigo.mjs). Datas guardadas em UTC sem fuso (como o Prisma gravava).
import { randomUUID } from "node:crypto";
import { consulta } from "./db.js";
import { garantirTabela, guardarDetalhe, iniciarPreferencias, lerApp, sincronizarRecentes } from "./preferencias-app.js";

const G = globalThis;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => (v == null ? null : Number(v));
const invalido = (msg) => Object.assign(new Error(msg), { statusCode: 400 });

// ---------- tabelas (já existem no banco; aqui só para um banco novo) ----------
let pronta = null;
export function garantirTabelas() {
  if (!pronta) pronta = (async () => {
    await consulta(`create table if not exists sorelly.montagem_kit_registro (
      id text primary key, "resellerId" int not null, "resellerNome" text not null, "staffNome" text not null default '',
      "valorKit" numeric(10,2) not null default 0, "usouPreferencias" boolean not null, "iniciadoEm" timestamp(3) not null, "concluidoEm" timestamp(3) not null,
      "montadoPorNome" text not null, "montadoPorEmail" text not null, "createdAt" timestamp(3) not null default current_timestamp, "updatedAt" timestamp(3) not null)`);
    await consulta(`create index if not exists "montagem_kit_registro_resellerId_idx" on sorelly.montagem_kit_registro ("resellerId")`);
    await consulta(`create index if not exists "montagem_kit_registro_concluidoEm_idx" on sorelly.montagem_kit_registro ("concluidoEm")`);
    await consulta(`create table if not exists sorelly.montagem_staff (
      id text primary key, name text not null, active boolean not null default true, position int not null default 0,
      "createdAt" timestamp(3) not null default current_timestamp, "updatedAt" timestamp(3) not null)`);
    await consulta(`create table if not exists sorelly.montagem_bonus_config (
      id text primary key default 'default', "limiteKitEspecial" numeric(10,2) not null default 12000, "metaKitsNormal" int not null default 8,
      "bonusBaseNormal" numeric(10,2) not null default 15, "bonusExtraNormal" numeric(10,2) not null default 2, "metaKitsEspecial" int not null default 6,
      "bonusBaseEspecial" numeric(10,2) not null default 15, "bonusExtraEspecial" numeric(10,2) not null default 3, "usarFiltroAvaliacao" boolean not null default true,
      "updatedAt" timestamp(3) not null)`);
  })().catch((e) => { pronta = null; throw e; });
  return pronta;
}

// ---------- quem pode ----------
// Ler e registrar montagem: setor Montagem (a Diretoria abre tudo). Mudar a equipe e as regras do bônus: só a Diretoria (igual ao admin antigo).
export const podeMontagem = (eu) => eu?.perfil === "ADMIN" || (eu?.setores || []).includes("montagem");
export const podeGerir = (eu) => eu?.perfil === "ADMIN";

// ---------- última montagem de cada revendedora ----------
// Registros da Fila + kits das Listagens com a montagem concluída (fimM) e revendedora do app (revendedoraId numérico).
export async function ultimasMontagens() {
  await garantirTabelas();
  const m = new Map();
  const r = await consulta(`select "resellerId" as id, max("concluidoEm") at time zone 'UTC' as em from sorelly.montagem_kit_registro group by 1`);
  r.rows.forEach((x) => m.set(Number(x.id), new Date(x.em)));
  try {
    const k = await consulta(`select k->>'revendedoraId' as id, max((k->>'fimM')::bigint) as fim from sorelly.estado_modulo, jsonb_array_elements(coalesce(conteudo->'kits', '[]'::jsonb)) k
      where modulo = 'lst' and k->>'fimM' ~ '^[0-9]+$' and k->>'revendedoraId' ~ '^[0-9]+$' group by 1`);
    k.rows.forEach((x) => { const id = Number(x.id), em = new Date(Number(x.fim)), a = m.get(id); if (!a || em > a) m.set(id, em); });
  } catch (x) { /* sem listagens no servidor: só os registros */ }
  return m;
}

// ---------- Fila ----------
// Lista inteira (a tabela filtra e ordena nas colunas). Antes, uma leitura rápida do app para quem acabou de salvar as preferências aparecer.
export async function listaFila({ atualizar = false } = {}) {
  await garantirTabela();
  const vazia = !(await consulta("select 1 from sorelly.preferencia_app limit 1")).rows.length;
  if (vazia || atualizar === "tudo") await iniciarPreferencias({ forcar: true }).catch(() => {});   // primeira vez: leitura completa em segundo plano
  else await Promise.race([sincronizarRecentes({ forcar: !!atualizar }), new Promise((z) => setTimeout(z, 8000))]).catch(() => {});
  const [r, ult] = await Promise.all([
    consulta("select id, nome, telefone, cidade, estado, tem_prefs, atualizado_em, categorias, ouro, prata from sorelly.preferencia_app order by nome"),
    ultimasMontagens(),
  ]);
  const st = (G.__sorellyPrefApp || {});
  return {
    lendoApp: !!st.rodando, lidoEm: st.rapidaEm || st.concluidaEm || null,
    revendedoras: r.rows.map((x) => {
      const u = ult.get(x.id) || null, at = x.atualizado_em ? new Date(x.atualizado_em) : null;
      return { id: x.id, nome: x.nome, telefone: x.telefone || "", cidade: x.cidade || "", estado: x.estado || "", temPreferencias: !!x.tem_prefs && !!at,
        atualizadoEm: at ? at.toISOString() : null, categorias: x.categorias || 0, ouro: num(x.ouro), prata: num(x.prata),
        ultimaMontagem: u ? u.toISOString() : null, jaMontado: !!(u && at && u >= at) };
    }),
  };
}

// Detalhe de uma revendedora, lido AGORA do app (como no admin antigo). Se o app não responder, usa a cópia guardada e avisa.
export async function detalheRevendedora(id) {
  await garantirTabela();
  let d = null, doCache = false;
  try { d = await lerApp("/revendedoras/kit-preferences/" + id); guardarDetalhe(d).catch(() => {}); }
  catch (x) {
    if (x && x.statusCode === 404) throw x;
    const c = (await consulta("select * from sorelly.preferencia_app where id = $1", [id])).rows[0];
    if (!c) throw x;
    doCache = true;
    d = { id: c.id, nome: c.nome, telefone: c.telefone || "", email: "", regiao: { cidade: c.cidade, estado: c.estado }, configSync: true,
      preferencias: { temPreferencias: !!c.atualizado_em, displayName: null, observations: c.observacoes || "", answers: c.respostas || {}, categoriasRespondidas: c.categorias || 0,
        resumoGeral: c.ouro == null ? [] : [{ ouro: Number(c.ouro), prata: Number(c.prata) }], atualizadoEm: c.atualizado_em ? new Date(c.atualizado_em).toISOString() : null } };
  }
  const ult = (await ultimasMontagens()).get(Number(id)) || null, at = d.preferencias && d.preferencias.atualizadoEm ? new Date(d.preferencias.atualizadoEm) : null;
  const registros = (await listarRegistros({ resellerId: Number(id), page: 1, pageSize: 20 })).data;
  return Object.assign({}, d, { doCache, jaMontado: !!(ult && at && ult >= at), ultimaMontagem: ult ? ult.toISOString() : null, registros });
}

// Análise geral das preferências (a mesma do app, lida agora)
export const analiseApp = () => lerApp("/revendedoras/kit-preferences/analytics");

// ---------- registros de montagem ----------
const COLS_REG = `id, "resellerId", "resellerNome", "staffNome", "valorKit", "usouPreferencias", "iniciadoEm" at time zone 'UTC' as "iniciadoEm",
  "concluidoEm" at time zone 'UTC' as "concluidoEm", "montadoPorNome", "montadoPorEmail", "createdAt" at time zone 'UTC' as "createdAt"`;
const regDto = (x) => ({ id: x.id, resellerId: x.resellerId, resellerNome: x.resellerNome, staffNome: x.staffNome, valorKit: Number(x.valorKit), usouPreferencias: x.usouPreferencias,
  iniciadoEm: new Date(x.iniciadoEm).toISOString(), concluidoEm: new Date(x.concluidoEm).toISOString(), montadoPorNome: x.montadoPorNome, montadoPorEmail: x.montadoPorEmail,
  createdAt: new Date(x.createdAt).toISOString() });

export async function listarRegistros({ resellerId = null, page = 1, pageSize = 20 } = {}) {
  await garantirTabelas();
  const ps = Math.max(1, Math.min(500, Math.round(pageSize) || 20)), pg = Math.max(1, Math.round(page) || 1);
  const onde = resellerId != null ? `where "resellerId" = $3` : "", p = resellerId != null ? [ps, (pg - 1) * ps, resellerId] : [ps, (pg - 1) * ps];
  const [r, t] = await Promise.all([
    consulta(`select ${COLS_REG} from sorelly.montagem_kit_registro ${onde} order by "concluidoEm" desc limit $1 offset $2`, p),
    consulta(`select count(*)::int as n from sorelly.montagem_kit_registro ${resellerId != null ? `where "resellerId" = $1` : ""}`, resellerId != null ? [resellerId] : []),
  ]);
  const total = t.rows[0].n;
  return { data: r.rows.map(regDto), total, page: pg, pageSize: ps, totalPages: Math.max(1, Math.ceil(total / ps)) };
}

const dataValida = (v) => typeof v === "string" && !isNaN(Date.parse(v));
export async function criarRegistro(b, eu) {
  await garantirTabelas();
  const resellerId = Number(b.resellerId), resellerNome = String(b.resellerNome || "").trim(), staffNome = String(b.staffNome || "").trim();
  if (!Number.isInteger(resellerId)) throw invalido("revendedora");
  if (!resellerNome) throw invalido("nome da revendedora");
  if (!staffNome) throw Object.assign(new Error("Selecione quem montou o kit."), { statusCode: 400 });
  if (!dataValida(b.iniciadoEm) || !dataValida(b.concluidoEm)) throw Object.assign(new Error("Informe o horário de início e término."), { statusCode: 400 });
  if (Date.parse(b.concluidoEm) < Date.parse(b.iniciadoEm)) throw Object.assign(new Error("O horário de término não pode ser antes do início."), { statusCode: 400 });
  const valor = b.valorKit == null || b.valorKit === "" ? 0 : Number(b.valorKit);
  if (!isFinite(valor) || valor < 0) throw Object.assign(new Error("Valor do kit inválido."), { statusCode: 400 });
  const r = await consulta(`insert into sorelly.montagem_kit_registro (id, "resellerId", "resellerNome", "staffNome", "valorKit", "usouPreferencias", "iniciadoEm", "concluidoEm", "montadoPorNome", "montadoPorEmail", "updatedAt")
    values ($1, $2, $3, $4, $5, $6, ($7::timestamptz at time zone 'UTC'), ($8::timestamptz at time zone 'UTC'), $9, $10, (now() at time zone 'UTC')) returning ${COLS_REG}`,
  [randomUUID(), resellerId, resellerNome, staffNome, r2(valor), b.usouPreferencias === true, b.iniciadoEm, b.concluidoEm, String(eu?.nome || ""), String(eu?.email || "")]);
  return regDto(r.rows[0]);
}

// Valor do kit depois (a montadora não vê dinheiro e registra sem valor; a supervisão completa)
export async function definirValor(id, valor) {
  await garantirTabelas();
  const v = Number(valor);
  if (!isFinite(v) || v < 0) throw Object.assign(new Error("Valor do kit inválido."), { statusCode: 400 });
  const r = await consulta(`update sorelly.montagem_kit_registro set "valorKit" = $2, "updatedAt" = (now() at time zone 'UTC') where id = $1 returning ${COLS_REG}`, [String(id), r2(v)]);
  if (!r.rows[0]) throw Object.assign(new Error("Registro não encontrado."), { statusCode: 404 });
  return regDto(r.rows[0]);
}

// ---------- equipe da montagem ----------
const staffDto = (x) => ({ id: x.id, name: x.name, active: x.active, position: x.position });
export async function listarEquipe() {
  await garantirTabelas();
  return (await consulta("select id, name, active, position from sorelly.montagem_staff order by position, name")).rows.map(staffDto);
}
const nomeValido = (v) => { const n = String(v == null ? "" : v).trim(); if (!n || n.length > 120) throw Object.assign(new Error("Informe o nome (até 120 letras)."), { statusCode: 400 }); return n; };
export async function criarPessoa(b) {
  await garantirTabelas();
  const name = nomeValido(b.name);
  const dup = await consulta("select 1 from sorelly.montagem_staff where lower(name) = lower($1)", [name]);
  if (dup.rows.length) throw Object.assign(new Error("Essa pessoa já está na equipe."), { statusCode: 400 });
  const pos = (await consulta("select coalesce(max(position), -1) + 1 as p from sorelly.montagem_staff")).rows[0].p;
  const r = await consulta(`insert into sorelly.montagem_staff (id, name, active, position, "updatedAt") values ($1, $2, true, $3, (now() at time zone 'UTC')) returning id, name, active, position`, [randomUUID(), name, pos]);
  return staffDto(r.rows[0]);
}
export async function mudarPessoa(id, b) {
  await garantirTabelas();
  const sets = [], p = [String(id)];
  if (b.name !== undefined) { p.push(nomeValido(b.name)); sets.push("name = $" + p.length); }
  if (b.active !== undefined) { p.push(b.active === true); sets.push("active = $" + p.length); }
  if (b.position !== undefined) { if (!Number.isInteger(b.position)) throw invalido("posição"); p.push(b.position); sets.push("position = $" + p.length); }
  if (!sets.length) throw invalido("nada para mudar");
  const r = await consulta(`update sorelly.montagem_staff set ${sets.join(", ")}, "updatedAt" = (now() at time zone 'UTC') where id = $1 returning id, name, active, position`, p);
  if (!r.rows[0]) throw Object.assign(new Error("Colaboradora não encontrada."), { statusCode: 404 });
  return staffDto(r.rows[0]);
}
export async function excluirPessoa(id) {
  await garantirTabelas();
  const r = await consulta("delete from sorelly.montagem_staff where id = $1", [String(id)]);
  if (!r.rowCount) throw Object.assign(new Error("Colaboradora não encontrada."), { statusCode: 404 });
}

// ---------- regras do bônus ----------
const CAMPOS_BONUS = ["limiteKitEspecial", "metaKitsNormal", "bonusBaseNormal", "bonusExtraNormal", "metaKitsEspecial", "bonusBaseEspecial", "bonusExtraEspecial"];
const INTEIROS = ["metaKitsNormal", "metaKitsEspecial"];
const bonusDto = (x) => { const o = { usarFiltroAvaliacao: !!x.usarFiltroAvaliacao }; CAMPOS_BONUS.forEach((k) => { o[k] = Number(x[k]); }); return o; };
export async function regrasBonus() {
  await garantirTabelas();
  await consulta(`insert into sorelly.montagem_bonus_config (id, "updatedAt") values ('default', (now() at time zone 'UTC')) on conflict (id) do nothing`);
  return bonusDto((await consulta("select * from sorelly.montagem_bonus_config where id = 'default'")).rows[0]);
}
export async function salvarRegrasBonus(b) {
  await regrasBonus();
  const sets = [], p = [];
  CAMPOS_BONUS.forEach((k) => {
    if (b[k] === undefined) return;
    const v = Number(b[k]);
    if (!isFinite(v) || v < 0 || (INTEIROS.includes(k) && !Number.isInteger(v))) throw Object.assign(new Error("Valor inválido em " + k + "."), { statusCode: 400 });
    p.push(INTEIROS.includes(k) ? v : r2(v)); sets.push(`"${k}" = $${p.length}`);
  });
  if (b.usarFiltroAvaliacao !== undefined) { p.push(b.usarFiltroAvaliacao === true); sets.push(`"usarFiltroAvaliacao" = $${p.length}`); }
  if (sets.length) await consulta(`update sorelly.montagem_bonus_config set ${sets.join(", ")}, "updatedAt" = (now() at time zone 'UTC') where id = 'default'`, p);
  return regrasBonus();
}

// ---------- relatório do bônus ----------
const BRT = 3 * 3600 * 1000;   // Brasília, UTC-3 fixo (sem horário de verão desde 2019)
const partesBrt = (d) => { const x = new Date(d.getTime() - BRT); return { dia: x.toISOString().slice(0, 10), hora: x.getUTCHours() }; };
const periodoDe = (h) => (h >= 8 && h < 12 ? "MANHA" : h >= 13 && h < 17 ? "TARDE" : null);   // fora dessas janelas não conta
const faixa = (kits, meta, base, extra) => (kits < meta ? 0 : base + (kits - meta) * extra);
const fatorDe = (pct) => (pct === null ? 1 : pct < 50 ? 0 : pct < 70 ? 0.5 : 1);
const DIA = /^\d{4}-\d{2}-\d{2}$/;

// média (0–100%) das avaliações da representante de cada revendedora (representante = a da avaliação mais recente da revendedora)
async function mediasDasRepresentantes(ids) {
  const porRev = new Map(), mediaRep = new Map();
  if (!ids.length) return { porRev, mediaRep };
  try {
    const a = await consulta(`select distinct on ("revendedoraUserId") "revendedoraUserId" as rev, "representanteCod" as cod from sorelly.avaliacao
      where "revendedoraUserId" = any($1::int[]) and "representanteCod" is not null order by "revendedoraUserId", "enviadaEm" desc`, [ids]);
    a.rows.forEach((x) => porRev.set(Number(x.rev), x.cod));
    const cods = [...new Set(porRev.values())];
    if (cods.length) {
      const m = await consulta(`with perg as (select id, case tipo::text when 'ESTRELA_5' then 5 when 'NOTA_10' then 10 end as mx from sorelly.avaliacao_pergunta
          where categoria::text = 'REPRESENTANTE' and ativo and tipo::text in ('ESTRELA_5', 'NOTA_10'))
        select a."representanteCod" as cod, round(avg(r."valorNumerico"::numeric / p.mx * 5), 2) as media
        from sorelly.avaliacao a join sorelly.avaliacao_resposta r on r."avaliacaoId" = a.id join perg p on p.id = r."perguntaId"
        where a."representanteCod" = any($1::text[]) and r."valorNumerico" is not null group by 1`, [cods]);
      m.rows.forEach((x) => mediaRep.set(x.cod, Number(x.media) * 20));
    }
  } catch (x) { /* sem avaliações neste banco: fator neutro */ }
  return { porRev, mediaRep };
}

export async function relatorioBonus({ de, ate, quem = "" }) {
  if (!DIA.test(de || "") || !DIA.test(ate || "")) throw invalido("período (de e até no formato AAAA-MM-DD)");
  const cfg = await regrasBonus();
  const ini = de + "T03:00:00.000Z", fim = new Date(Date.parse(ate + "T03:00:00.000Z") + 86400000).toISOString();
  const p = [ini, fim]; let onde = "";
  if (quem) { p.push(quem); onde = ` and "staffNome" = $3`; }
  const r = await consulta(`select "staffNome", "resellerId", "valorKit", "iniciadoEm" at time zone 'UTC' as "iniciadoEm" from sorelly.montagem_kit_registro
    where "iniciadoEm" >= ($1::timestamptz at time zone 'UTC') and "iniciadoEm" < ($2::timestamptz at time zone 'UTC')${onde}`, p);
  const grupos = new Map();
  r.rows.forEach((x) => {
    const pt = partesBrt(new Date(x.iniciadoEm)), per = periodoDe(pt.hora);
    if (!per) return;
    const k = x.staffNome + "|" + pt.dia + "|" + per;
    const g = grupos.get(k) || { staffNome: x.staffNome, data: pt.dia, periodo: per, kitsNormais: 0, kitsEspeciais: 0, revs: new Set() };
    if (Number(x.valorKit) > cfg.limiteKitEspecial) g.kitsEspeciais++; else g.kitsNormais++;
    g.revs.add(Number(x.resellerId)); grupos.set(k, g);
  });
  const lista = [...grupos.values()];
  const av = cfg.usarFiltroAvaliacao ? await mediasDasRepresentantes([...new Set(lista.flatMap((g) => [...g.revs]))]) : null;
  const rows = lista.map((g) => {
    const bn = faixa(g.kitsNormais, cfg.metaKitsNormal, cfg.bonusBaseNormal, cfg.bonusExtraNormal);
    const be = faixa(g.kitsEspeciais, cfg.metaKitsEspecial, cfg.bonusBaseEspecial, cfg.bonusExtraEspecial);
    let media = null;
    if (av) { const ms = [...g.revs].map((id) => av.porRev.get(id)).filter(Boolean).map((c) => av.mediaRep.get(c)).filter((m) => m != null); media = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : null; }
    const fator = cfg.usarFiltroAvaliacao ? fatorDe(media) : 1;
    return { staffNome: g.staffNome, data: g.data, periodo: g.periodo, kitsNormais: g.kitsNormais, kitsEspeciais: g.kitsEspeciais, bonusNormal: r2(bn), bonusEspecial: r2(be),
      mediaAvaliacaoPct: media === null ? null : r2(media), fatorAvaliacao: fator, bonusTotal: r2((bn + be) * fator) };
  }).sort((a, b) => (a.data === b.data ? a.staffNome.localeCompare(b.staffNome) || a.periodo.localeCompare(b.periodo) : a.data.localeCompare(b.data)));
  return { rows, config: cfg };
}

// ---------- configuração pública do formulário (o app da revendedora lê) ----------
// Igual ao GET /admin/kit/preferences do admin antigo: { version, blocks }, só ativos, na ordem, sem "enabled"; "Observações" é do sistema e sempre existe.
const TIPOS = ["id", "slider", "filhos", "letras", "vend", "vendsimple", "vendmetal"];
const INTERNOS = ["key", "title", "accent", "type", "enabled", "position", "criadoPor", "atualizadoPor", "atualizadoEm", "numero", "sistema"];
const OBS = { key: "observacoes", title: "Observações", accent: "#FFF3D6", type: "observacoes" };
const ehHex = (v) => /^#[0-9a-fA-F]{6}$/.test(String(v || ""));
function montarPublico(pk) {
  const blocos = Array.isArray(pk && pk.blocos) ? pk.blocos : [];
  const lista = blocos.filter((b) => b && b.key !== OBS.key && TIPOS.includes(b.type) && b.key && b.title && ehHex(b.accent)).map((b, i) => {
    const o = { key: String(b.key), title: String(b.title), accent: String(b.accent), type: b.type };
    Object.keys(b).forEach((k) => { if (!INTERNOS.includes(k)) o[k] = b[k]; });
    if (b.type === "id") { delete o.allowImages; delete o.maxImages; } else { o.allowImages = b.allowImages === true; o.maxImages = 3; }
    return { p: Number(b.position) || 0, i, on: b.enabled !== false, b: o };
  });
  const obs = pk && pk.obs ? pk.obs : null;
  lista.push({ p: obs && obs.position != null ? Number(obs.position) : lista.length, i: 1e9, on: !obs || obs.enabled !== false, b: Object.assign({}, OBS) });
  lista.sort((a, b) => a.p - b.p || a.i - b.i);
  return { version: Number(pk && pk.config && pk.config.versao) || 1, blocks: lista.filter((x) => x.on).map((x) => x.b) };
}
const CACHE_CFG = 30 * 1000;
export async function configPublica() {
  const c = G.__sorellyKitCfg;
  if (c && Date.now() - c.em < CACHE_CFG) return c.v;
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'pk'");
  const v = montarPublico(r.rows[0] ? r.rows[0].conteudo : null);
  G.__sorellyKitCfg = { em: Date.now(), v };
  return v;
}
