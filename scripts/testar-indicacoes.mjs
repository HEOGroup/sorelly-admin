// Teste das Indicações ao vivo (19/11/2026): src/server/indicacoes.js com Postgres em memória (PGlite) e um app e uma Kommo FALSOS (servidor http local).
// Não toca no banco do sistema, no app de verdade nem na Kommo. Também confere o domínio (saldo ao vivo, data passada até 30 dias).
// Uso (na pasta sorelly-prototipo):  node --import ./scripts/registrar-carregador.mjs scripts/testar-indicacoes.mjs   (saída 1 = alguma verificação falhou)
// O PGlite vem do backend do app (sorelly-app/apps/backend/node_modules); outra pasta: PGLITE=caminho/para/pglite/dist/index.js
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const RAIZ = path.resolve(import.meta.dirname, "..");
const PGL = process.env.PGLITE || path.resolve(RAIZ, "../sorelly-app/apps/backend/node_modules/@electric-sql/pglite/dist/index.js");
if (!existsSync(PGL)) { console.error("PGlite não encontrado em " + PGL + " (defina PGLITE)."); process.exit(1); }
const { PGlite } = await import(pathToFileURL(PGL).href);
const db = new PGlite();
await db.exec(`create schema sorelly;
  create table sorelly.estado_modulo (modulo text primary key, conteudo jsonb not null default '{}', versao integer not null default 0, atualizado_por text, atualizado_em timestamptz not null default now());
  create table sorelly.preferencia_app (id int primary key, nome text not null default '', telefone text, cidade text not null default '', estado text not null default '');
  insert into sorelly.preferencia_app (id, nome, telefone) values (77, 'CARLA SEM MOEDA', '5541911112222');`);
globalThis.__sorellyPool = { query: (sql, p) => db.query(sql, p || []), connect: async () => ({ query: (sql, p) => db.query(sql, p || []), release() {} }) };

// ---------- app e Kommo falsos ----------
const agora = () => new Date().toISOString();
const A = {
  saldo: { 10: 3000, 11: 1000, 12: 0 },
  users: { 10: { nome: "Maria Teste", telefone: "5541999990000" }, 11: { nome: "Ana Teste", telefone: "5541988880000" }, 12: { nome: "Bia Teste", telefone: "" }, 77: { nome: "Carla Sem Moeda", telefone: "" } },
  resgates: [
    { id: 1, userId: 10, premioCodigo: "PREMIO_1", premioNivel: 1, premioTitulo: "R$ 400 em semijoias", premioValorCentavos: 40000, custoMoedas: 1000, status: "solicitado", criadoEm: "2026-11-18T13:00:00.000Z", entregueEm: null, canceladoEm: null, canceladoMotivo: null, retiradaEm: null },
    { id: 2, userId: 10, premioCodigo: "PREMIO_2", premioNivel: 2, premioTitulo: "R$ 1.000 em semijoias", premioValorCentavos: 100000, custoMoedas: 2000, status: "aprovado", criadoEm: "2026-11-17T13:00:00.000Z", entregueEm: null, canceladoEm: null, canceladoMotivo: null, retiradaEm: "2026-11-20" },
    { id: 3, userId: 77, premioCodigo: "PREMIO_1", premioNivel: 1, premioTitulo: "R$ 400 em semijoias", premioValorCentavos: 40000, custoMoedas: 1000, status: "solicitado", criadoEm: "2026-11-19T10:00:00.000Z", entregueEm: null, canceladoEm: null, canceladoMotivo: null, retiradaEm: null },
  ],
  ind: [
    { id: 100, status: "em_andamento", leadId: 9001, moedasCreditadas: 0, creditedAt: null, statusChangedAt: "2026-11-10T12:00:00.000Z", createdAt: "2026-11-09T12:00:00.000Z", nome: "Indicada Um", whatsapp: "5541977770000", rev: 10 },
    { id: 101, status: "cancelado", leadId: 9002, moedasCreditadas: 0, creditedAt: null, statusChangedAt: "2026-11-12T12:00:00.000Z", createdAt: "2026-11-01T12:00:00.000Z", nome: "Indicada Dois", whatsapp: "5541966660000", rev: 11 },
    { id: 102, status: "finalizado", leadId: 9003, moedasCreditadas: 1000, creditedAt: "2026-11-15T12:00:00.000Z", statusChangedAt: "2026-11-15T12:00:00.000Z", createdAt: "2026-10-20T12:00:00.000Z", nome: "Indicada Tres", whatsapp: "5541955550000", rev: 10 },
  ],
  chamadas: [], kommo: [],
};
const PREMIOS = [{ codigo: "PREMIO_1", titulo: "R$ 400 em semijoias", custoMoedas: 1000, valorCentavos: 40000 }, { codigo: "PREMIO_2", titulo: "R$ 1.000 em semijoias", custoMoedas: 2000, valorCentavos: 100000 }];
const indDto = (i) => ({ id: i.id, status: i.status, statusLabel: i.status, leadId: i.leadId, moedasCreditadas: i.moedasCreditadas, creditadoEm: i.creditedAt, statusAlteradoEm: i.statusChangedAt, criadoEm: i.createdAt, atualizadoEm: i.statusChangedAt,
  indicada: { nome: i.nome, whatsapp: i.whatsapp }, revendedora: { id: i.rev, nome: A.users[i.rev].nome, email: null, telefone: A.users[i.rev].telefone } });
const ler = (req) => new Promise((ok) => { const p = []; req.on("data", (c) => p.push(c)); req.on("end", () => { const t = Buffer.concat(p).toString(); ok(t ? JSON.parse(t) : null); }); });
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), corpo = await ler(req), m = req.method, p = u.pathname;
  const env = (st, j) => { res.writeHead(st, { "content-type": "application/json" }); res.end(JSON.stringify(j)); };
  if (p.startsWith("/kommo/")) {
    A.kommo.push({ m, p: p.slice(6), corpo });
    if (m === "GET" && /\/leads\/9002$/.test(p)) return env(200, { id: 9002, custom_fields_values: [{ field_id: 1716048, values: [{ value: "Sem interesse" }] }] });
    if (m === "POST" && p.endsWith("/contacts")) return env(200, { _embedded: { contacts: [{ id: 555 }] } });
    if (m === "POST" && p.endsWith("/leads") && A.kommo429 > 0) { A.kommo429--; res.writeHead(429, { "content-type": "application/json", "retry-after": "1" }); return res.end("{}"); }
    if (m === "POST" && p.endsWith("/leads")) return env(200, { _embedded: { leads: [{ id: 777 }] } });
    if (m === "PATCH" && p.endsWith("/leads")) return env(200, {});
    return env(404, {});
  }
  if (req.headers.authorization !== "Bearer chave-teste") return env(401, { error: "sem chave" });
  A.chamadas.push({ m, p, q: u.search, corpo });
  let r;
  if (m === "GET" && p === "/api/admin/indicacoes/resgates") return env(200, { resgates: A.resgates.filter((x) => x.status === u.searchParams.get("status")) });
  if ((r = /^\/api\/admin\/indicacoes\/resgates\/(\d+)$/.exec(p))) {
    const x = A.resgates.find((y) => y.id === +r[1]); if (!x) return env(404, { error: "Resgate não encontrado." });
    const { userId, ...dto } = x;
    if (m === "GET") return env(200, { resgate: dto });
    if (m === "PATCH") {
      let estornou = false;
      if (corpo.status === "cancelado" && x.status !== "cancelado") { A.saldo[x.userId] += x.custoMoedas; estornou = true; x.canceladoEm = agora(); x.canceladoMotivo = corpo.motivo; }
      if (corpo.status === "entregue") x.entregueEm = agora();
      if (corpo.retiradaEm) x.retiradaEm = corpo.retiradaEm;
      x.status = corpo.status; const { userId: _, ...d2 } = x; return env(200, { ok: true, resgate: d2, estornou, saldoMoedas: A.saldo[x.userId] });
    }
  }
  if (m === "POST" && p === "/api/admin/indicacoes/resgates") {
    const pr = PREMIOS.find((x) => x.codigo === corpo.premioCodigo); if (!A.users[corpo.revendedoraId]) return env(404, { error: "Revendedora não encontrada no app." });
    if (A.saldo[corpo.revendedoraId] < pr.custoMoedas) return env(409, { code: "saldo_insuficiente", error: "Saldo insuficiente.", saldoMoedas: A.saldo[corpo.revendedoraId], custoMoedas: pr.custoMoedas });
    A.saldo[corpo.revendedoraId] -= pr.custoMoedas;
    const n = { id: A.resgates.length + 1, userId: corpo.revendedoraId, premioCodigo: pr.codigo, premioNivel: 1, premioTitulo: pr.titulo, premioValorCentavos: pr.valorCentavos, custoMoedas: pr.custoMoedas, status: "solicitado", criadoEm: agora(), entregueEm: null, canceladoEm: null, canceladoMotivo: null, retiradaEm: null };
    A.resgates.push(n); const { userId, ...d } = n; return env(201, { ok: true, resgate: d, saldoMoedas: A.saldo[corpo.revendedoraId] });
  }
  if (m === "GET" && p === "/api/admin/indicacoes") { const off = +u.searchParams.get("offset") || 0, lim = +u.searchParams.get("limit") || 50; return env(200, { indicacoes: A.ind.slice(off, off + lim).map(indDto), paginacao: { total: A.ind.length, limit: lim, offset: off, hasMore: off + lim < A.ind.length }, totaisPorStatus: {} }); }
  if ((r = /^\/api\/admin\/indicacoes\/(\d+)\/status$/.exec(p)) && m === "PATCH") {
    const i = A.ind.find((y) => y.id === +r[1]); if (!i) return env(404, { error: "Indicação não encontrada." });
    if (i.status === "finalizado") return env(409, { code: "ja_finalizada", error: "Esta indicação já está como \"Kit entregue\" e as moedas já foram creditadas. Não dá para mudar o status." });
    const ant = i.status; i.status = corpo.status; i.statusChangedAt = agora();
    if (corpo.status === "finalizado" && corpo.creditarMoedas !== false) { i.moedasCreditadas = 1000; A.saldo[i.rev] += 1000; }
    return env(200, { ok: true, indicacaoId: i.id, status: i.status, statusAnterior: ant, moedasCreditadas: i.moedasCreditadas, saldoMoedas: A.saldo[i.rev] });
  }
  if (m === "POST" && p === "/api/admin/indicacoes") {
    const ex = A.ind.find((y) => y.whatsapp === String(corpo.whatsapp).replace(/\D/g, ""));
    if (corpo.status === "criado" && ex) return env(409, { ok: false, code: "whatsapp_ja_indicado", error: "Este WhatsApp já foi indicado anteriormente." });
    if (corpo.status === "criado") { const n = { id: 200 + A.ind.length, status: "criado", leadId: null, moedasCreditadas: 0, creditedAt: null, statusChangedAt: agora(), createdAt: agora(), nome: corpo.nome, whatsapp: String(corpo.whatsapp).replace(/\D/g, ""), rev: corpo.revendedoraId }; A.ind.push(n); return env(200, { ok: true, indicacaoId: n.id, criada: true, status: "criado" }); }
    ex.status = corpo.status; ex.leadId = corpo.leadId; return env(200, { ok: true, indicacaoId: ex.id, criada: false, status: corpo.status });
  }
  if (m === "GET" && p === "/api/admin/indicacoes/revendedoras") {
    const busca = (u.searchParams.get("busca") || "").toLowerCase();
    const items = Object.entries(A.users).map(([id, x]) => ({ id: +id, nome: x.nome, email: null, telefone: x.telefone, indicacoes: A.ind.filter((i) => i.rev === +id).length, moedas: A.saldo[id] || 0 }))
      .filter((x) => !busca || x.nome.toLowerCase().includes(busca)).sort((a, b) => b.indicacoes - a.indicacoes || b.moedas - a.moedas);
    return env(200, { items, total: items.length, page: 1, pageSize: 50 });
  }
  if ((r = /^\/api\/admin\/indicacoes\/revendedoras\/(\d+)\/moedas$/.exec(p)) && m === "POST") { A.saldo[r[1]] = (A.saldo[r[1]] || 0) + corpo.moedas; return env(200, { id: +r[1], entradaId: 1, moedas: corpo.moedas, saldo: A.saldo[r[1]] }); }
  if ((r = /^\/api\/admin\/indicacoes\/revendedoras\/(\d+)\/premios$/.exec(p))) return env(200, { saldoMoedas: A.saldo[r[1]], premios: PREMIOS.map((x) => ({ ...x, resgatavel: A.saldo[r[1]] >= x.custoMoedas })) });
  if ((r = /^\/api\/revendedoras\/kit-preferences\/(\d+)$/.exec(p))) { const x = A.users[r[1]]; return x ? env(200, { id: +r[1], nome: x.nome, telefone: x.telefone, email: "x@y.z" }) : env(404, {}); }
  return env(404, { message: "Route " + m + ":" + p + " not found" });
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const porta = srv.address().port;
process.env.MOBILE_API_URL = "http://127.0.0.1:" + porta + "/api"; process.env.MOBILE_API_KEY = "chave-teste";
process.env.KOMMO_API_URL = "http://127.0.0.1:" + porta + "/kommo"; process.env.KOMMO_ACCESS_TOKEN = "kommo-teste";
delete process.env.INDICACOES_GRAVAR; delete process.env.INDICACOES_KOMMO_GRAVAR; delete process.env.ADMIN_ANTIGO_DATABASE_URL;

const S = await import(pathToFileURL(path.join(RAIZ, "src/server/indicacoes.js")).href);
const D = await import("@/apps/montagem/domain/indicacoes");
let ok = 0, falhas = 0;
const t = async (nome, fn) => { try { await fn(); ok++; console.log("ok -", nome); } catch (e) { falhas++; console.log("FALHOU -", nome, "→", e.message); } };
const erroDe = async (fn) => { try { await fn(); return null; } catch (e) { return { msg: e.message, status: e.statusCode }; } };
const eu = { nome: "Michele Teste", perfil: "USER", setores: ["cadastro"] };
const hojeSP = S.paraSP(new Date()).slice(0, 10);
const diaMais = (n) => new Date(Date.UTC(+hojeSP.slice(0, 4), +hojeSP.slice(5, 7) - 1, +hojeSP.slice(8, 10) + n)).toISOString().slice(0, 10);
const op = async (id) => (await S.montarEstado({ forcar: true })).ind.resgates.find((r) => r.id === id).operacao;

await t("datas: Brasília ↔ UTC", () => { assert.equal(S.deSP("2026-11-19T14:30"), "2026-11-19T17:30:00.000Z"); assert.equal(S.paraSP("2026-11-19T17:30:00.000Z"), "2026-11-19T14:30:00"); });
await t("quem pode: cadastro lê e age; agendamento só confirma retirada; outro setor não", () => {
  assert.ok(S.podeLer(eu) && S.podeAcao(eu, "moedas_credito"));
  const ag = { perfil: "USER", setores: ["agendamento"] }; assert.ok(S.podeLer(ag) && S.podeAcao(ag, "resgate_entregar") && !S.podeAcao(ag, "moedas_credito"));
  assert.ok(!S.podeLer({ perfil: "USER", setores: ["rh"] }));
});

let est;
await t("estado no formato das telas", async () => {
  est = (await S.montarEstado({ forcar: true })).ind;
  assert.equal(est.aoVivo, true); assert.equal(est.resgates.length, 3); assert.equal(est.indicacoes.length, 3); assert.equal(est.premios.length, 2);
  const r1 = est.resgates.find((r) => r.id === 1); assert.equal(r1.revendedoraId, 10); assert.equal(r1.premioValor, 400); assert.equal(r1.criadoEm, "2026-11-18T10:00:00"); assert.deepEqual(r1.operacao.codigosPecas, []);
  assert.equal(est.gravacao.app, false);
});
await t("revendedora fora do ranking ganha nome (cópia da Fila de montagem)", () => { const c = est.revendedoras.find((r) => r.id === 77); assert.equal(c.nome, "CARLA SEM MOEDA"); });
await t("motivo da cancelada vem da Kommo (só leitura)", () => { assert.equal(est.indicacoes.find((i) => i.id === 101).motivoReprovacao, "Sem interesse"); assert.ok(A.kommo.every((k) => k.m === "GET")); });
await t("saldo ao vivo = saldo do app (domínio)", () => { assert.equal(D.saldoDe(est, 10).saldo, 3000); assert.equal(D.saldoDe(est, 12).saldo, 0); });
await t("extrato ao vivo: indicação creditada e pedidos", () => { const ls = est.extrato.filter((l) => String(l.revendedoraId) === "10"); assert.ok(ls.some((l) => l.tipo === "indicacao" && l.moedas === 1000)); assert.ok(ls.some((l) => l.tipo === "resgate" && l.moedas === -2000)); });

// ---------- sem a chave de gravação ----------
await t("sem INDICACOES_GRAVAR: agendar pedido na fila é recusado e nada é gravado", async () => {
  const antes = A.chamadas.filter((c) => c.m !== "GET").length;
  const e = await erroDe(() => S.executarAcao({ op: "resgate_agendar", id: 1, dia: diaMais(1), horario: "10:00" }, eu)); assert.equal(e.status, 503);
  assert.equal(A.chamadas.filter((c) => c.m !== "GET").length, antes); assert.equal((await op(1)).dataAgendada, null);
});
await t("sem INDICACOES_GRAVAR: balcão (só deste sistema) grava", async () => {
  const m = await S.executarAcao({ op: "resgate_set", id: 2, emContato: true, codigosPecas: "an123, br456 an123", observacao: "Liga depois das 14h" }, eu); assert.match(m, /balcão/);
  const o = await op(2); assert.deepEqual(o.codigosPecas, ["AN123", "BR456"]); assert.equal(o.emContato, true); assert.ok(o.emContatoEm); assert.equal(o.atualizadoPor, "Michele Teste");
});
await t("balcão: campo não enviado não apaga; null limpa; etapa nunca", async () => {
  await S.executarAcao({ op: "resgate_set", id: 2, responsavelNome: "Kawany" }, eu); let o = await op(2); assert.equal(o.observacao, "Liga depois das 14h");
  await S.executarAcao({ op: "resgate_set", id: 2, observacao: null, emContato: false }, eu); o = await op(2); assert.equal(o.observacao, null); assert.equal(o.emContatoEm, null);
  const e = await erroDe(() => S.salvarBalcao(2, { status: "entregue" }, "x")); assert.equal(e.status, 400);
});
const COMPLETA = { cidade: "Curitiba", cep: "80000-000", endereco: "Rua A", numero: "10", form: { situacao: "nao" } };
await t("sem INDICACOES_KOMMO_GRAVAR a indicação manual não grava nada", async () => {
  process.env.INDICACOES_GRAVAR = "1";
  const e = await erroDe(() => S.executarAcao(Object.assign({ op: "ind_add", revendedoraId: 10, nome: "Nova", whatsapp: "(41) 94444-0000" }, COMPLETA), eu)); assert.equal(e.status, 503); assert.match(e.msg, /Kommo/);
  assert.ok(!A.ind.some((i) => i.nome === "Nova"));
});
await t("indicação manual: os obrigatórios do antigo (cidade, CEP, endereço, número, caminho) barram antes de gravar", async () => {
  process.env.INDICACOES_KOMMO_GRAVAR = "1"; const antes = A.chamadas.length, kAntes = A.kommo.length;
  const base = { op: "ind_add", revendedoraId: 10, nome: "Incompleta", whatsapp: "41922220000" };
  assert.match((await erroDe(() => S.executarAcao(base, eu))).msg, /cidade/);
  assert.match((await erroDe(() => S.executarAcao(Object.assign({}, base, COMPLETA, { cep: "800" }), eu))).msg, /CEP/);
  assert.match((await erroDe(() => S.executarAcao(Object.assign({}, base, COMPLETA, { form: { situacao: "sim", nomeEmpresa: "Loja X" } }), eu))).msg, /cargo/);
  assert.match((await erroDe(() => S.executarAcao(Object.assign({}, base, COMPLETA, { form: { situacao: "autonoma" } }), eu))).msg, /área/);
  assert.equal(A.chamadas.length, antes); assert.equal(A.kommo.length, kAntes);
  delete process.env.INDICACOES_KOMMO_GRAVAR;
});

// ---------- com gravação ----------
await t("agendar: pedido na fila vai para aprovado com o dia (aviso da revendedora) e a hora certa", async () => {
  const m = await S.executarAcao({ op: "resgate_agendar", id: 1, dia: diaMais(1), horario: "14:30" }, eu); assert.match(m, /agendada/);
  const x = A.chamadas.filter((c) => c.m === "PATCH" && c.p.endsWith("/resgates/1")).pop(); assert.deepEqual(x.corpo, { status: "aprovado", retiradaEm: diaMais(1) });
  assert.equal((await op(1)).dataAgendada, diaMais(1) + "T14:30:00");
});
await t("agendar: data passada até 30 dias registra; 31 dias é recusado; horário fora da grade é recusado", async () => {
  assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_agendar", id: 2, dia: diaMais(-31), horario: "10:00" }, eu))).status, 400);
  assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_agendar", id: 2, dia: diaMais(1), horario: "10:15" }, eu))).status, 400);
  assert.match(await S.executarAcao({ op: "resgate_agendar", id: 2, dia: diaMais(-2), horario: "10:00" }, eu), /registrada/);
});
await t("confirmar retirada exige peças, valor e a conferência", async () => {
  assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_entregar", id: 2, codigosPecas: "", valorVenda: 100, revendedoraConfirmou: true }, eu))).status, 400);
  assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_entregar", id: 2, codigosPecas: "A1", valorVenda: 0, revendedoraConfirmou: true }, eu))).status, 400);
  assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_entregar", id: 2, codigosPecas: "A1", valorVenda: 100 }, eu))).status, 400);
});
await t("retirada junto: dois pedidos, mesmas peças, valor dividido pelo prêmio (soma bate)", async () => {
  const m = await S.executarAcao({ op: "resgate_entregar", id: 2, juntos: [1], codigosPecas: "AN1 BR2", valorVenda: 1400.01, valorDiferencaBrinde: 25, responsavelNome: "Kawany", revendedoraConfirmou: true }, eu);
  assert.match(m, /2 pedidos/);
  const o2 = await op(2), o1 = await op(1);
  assert.equal(Math.round((o2.valorVenda + o1.valorVenda) * 100), 140001); assert.equal(o2.valorVenda, 1000.01); assert.equal(o1.valorVenda, 400);
  assert.deepEqual(o1.codigosPecas, ["AN1", "BR2"]); assert.match(o1.observacao, /junto com o pedido #2/); assert.equal(o2.valorDiferencaBrinde, 25); assert.equal(o1.valorDiferencaBrinde, null);
  assert.ok(A.resgates.filter((r) => r.id <= 2).every((r) => r.status === "entregue"));
});
await t("pedido já retirado não muda (409)", async () => { assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_cancelar", id: 2, motivo: "teste" }, eu))).status, 409); });
await t("cancelar exige motivo e devolve as moedas", async () => {
  assert.equal((await erroDe(() => S.executarAcao({ op: "resgate_cancelar", id: 3, motivo: "  " }, eu))).status, 400);
  const m = await S.executarAcao({ op: "resgate_cancelar", id: 3, motivo: "sem estoque" }, eu); assert.match(m, /devolvidas/);
});
await t("pedido no balcão: saldo insuficiente avisa; com saldo, o app debita", async () => {
  const e = await erroDe(() => S.executarAcao({ op: "resgate_add", revendedoraId: 12, premioCodigo: "PREMIO_1" }, eu)); assert.equal(e.status, 409); assert.match(e.msg, /Saldo insuficiente/);
  const m = await S.executarAcao({ op: "resgate_add", revendedoraId: 11, premioCodigo: "PREMIO_1", observacao: "Veio no balcão" }, eu); assert.match(m, /criado/); assert.equal(A.saldo[11], 0);
  const novo = A.resgates[A.resgates.length - 1]; assert.equal((await op(novo.id)).observacao, "Veio no balcão");
});
await t("crédito manual de moedas (1 a 100.000)", async () => {
  assert.equal((await erroDe(() => S.executarAcao({ op: "moedas_credito", revendedoraId: 12, moedas: 0 }, eu))).status, 400);
  assert.match(await S.executarAcao({ op: "moedas_credito", revendedoraId: 12, moedas: 500, motivo: "ajuste" }, eu), /Saldo: 500/);
  const c = A.chamadas.filter((x) => x.p.endsWith("/12/moedas")).pop(); assert.equal(c.corpo.operador, "Michele Teste");
});
await t("funil: Kit entregue sem creditar (moedas já dadas à mão); Kit entregue não muda; Novas não é destino", async () => {
  await S.executarAcao({ op: "ind_etapa", id: 100, etapa: "finalizado", creditarMoedas: false }, eu); assert.equal(A.ind.find((i) => i.id === 100).moedasCreditadas, 0);
  assert.equal((await erroDe(() => S.executarAcao({ op: "ind_etapa", id: 102, etapa: "cancelado", motivo: "x" }, eu))).status, 409);
  assert.equal((await erroDe(() => S.executarAcao({ op: "ind_etapa", id: 101, etapa: "criado" }, eu))).status, 400);
  assert.match(await S.executarAcao({ op: "ind_voltar", id: 101 }, eu), /Em andamento/);
});
await t("indicação manual: app criado → lead na Kommo → app em andamento com o lead → dados da indicadora no lead", async () => {
  process.env.INDICACOES_KOMMO_GRAVAR = "1"; A.kommo.length = 0; A.kommo429 = 1;   // a Kommo responde "muitas chamadas" na 1ª tentativa do lead
  const m = await S.executarAcao({ op: "ind_add", revendedoraId: 10, nome: "Joana Nova", whatsapp: "(41) 93333-0000", cidade: "Curitiba", cep: "80000-000", endereco: "Rua A", numero: "10", form: { situacao: "autonoma", areaAutonoma: "Manicure", tempoAutonoma: "2 anos" }, observacao: "Prefere à tarde" }, eu);
  assert.match(m, /Lead 777/); assert.equal(A.kommo.filter((k) => k.m === "POST" && k.p.endsWith("/leads")).length, 2, "tentou de novo depois do 429");
  const lead = A.kommo.find((k) => k.m === "POST" && k.p.endsWith("/leads")).corpo[0];
  assert.equal(lead.status_id, 109136447); assert.deepEqual(lead._embedded.tags, [{ id: 148486, name: "INDICAÇÃO" }]); assert.deepEqual(lead._embedded.contacts, [{ id: 555 }]);
  assert.ok(lead.custom_fields_values.some((f) => f.field_id === 2075024 && f.values[0].value === "Origem: admin | Caminho: autônoma | Prefere à tarde"));
  const i = A.ind.find((x) => x.nome === "Joana Nova"); assert.equal(i.status, "em_andamento"); assert.equal(i.leadId, 777); assert.equal(i.whatsapp, "5541933330000");
  const patch = A.kommo.find((k) => k.m === "PATCH").corpo[0]; assert.ok(patch.custom_fields_values.some((f) => f.field_id === 2083841 && f.values[0].value === 10));
  const e = await erroDe(() => S.executarAcao(Object.assign({ op: "ind_add", revendedoraId: 10, nome: "Repetida", whatsapp: "41933330000" }, COMPLETA), eu)); assert.equal(e.status, 409);
});
await t("ação que só existia na cópia local é recusada com explicação", async () => { const e = await erroDe(() => S.executarAcao({ op: "premio_add", titulo: "X" }, eu)); assert.equal(e.status, 400); assert.match(e.msg, /app/); });
await t("busca de revendedora no app", async () => { const r = await S.buscarRevendedoras("bia"); assert.equal(r.fonte, "app"); assert.equal(r.itens[0].id, 12); assert.equal(r.itens[0].moedas, 500); });
await t("domínio: data passada até 30 dias, horário na grade", () => {
  const cfg = D.CONFIG_PADRAO; assert.ok(D.podeConfirmarAgendamento(diaMais(-30), "10:00", cfg, hojeSP)); assert.ok(!D.podeConfirmarAgendamento(diaMais(-31), "10:00", cfg, hojeSP)); assert.ok(!D.podeConfirmarAgendamento(diaMais(1), "10:10", cfg, hojeSP));
});

srv.close();
console.log("\n" + ok + " ok, " + falhas + " com falha.");
process.exit(falhas ? 1 : 0);
