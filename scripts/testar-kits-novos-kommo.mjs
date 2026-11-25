// Teste das regras Kommo → Kits novos (src/server/kits-novos-kommo-regras.js), sem rede e sem banco. 25/11/2026.
// Uso: node scripts/testar-kits-novos-kommo.mjs
import assert from "node:assert/strict";
import { KOMMO, aplicarEventos, classificarEvento, cidadeLimpa, entradaDoLead, kitDoLead, reais, regiaoDaCidade, telefoneDoContato } from "../src/server/kits-novos-kommo-regras.js";

let ok = 0;
const t = (nome, fn) => { fn(); ok++; console.log("ok  " + nome); };
const C = KOMMO.CAMPOS, A = KOMMO.FUNIL_APROVADAS, CAD = KOMMO.FUNIL_CADASTRO;
const ev = (lead, de, para, em = 1795600000) => ({ type: "lead_status_changed", entity_type: "lead", entity_id: lead, created_at: em,
  value_before: de ? [{ lead_status: { pipeline_id: de[0], id: de[1] } }] : [], value_after: [{ lead_status: { pipeline_id: para[0], id: para[1] } }] });
const f = (id, v) => ({ field_id: id, values: [{ value: v }] });
const lead = (id, campos, tags = [], contato = 900 + id) => ({ id, name: "Lead " + id, custom_fields_values: campos, _embedded: { tags: tags.map((n) => ({ name: n })), contacts: [{ id: contato }] } });
const contato = (id, tel) => ({ id, custom_fields_values: [{ field_code: "PHONE", values: [{ value: tel, enum_code: "MOB" }] }] });
const etapas = { 109141059: "cadastro aprovado", 109141063: "contato de referência", [KOMMO.KIT_LIBERADO]: "kit liberado", 143: "DESISTÊNCIA DO KIT" };

t("classifica aprovação, liberação, etapa e desfeita", () => {
  assert.equal(classificarEvento(ev(1, [CAD, 109136451], [A, 109141059])).tipo, "aprovou");
  assert.equal(classificarEvento(ev(1, [CAD, 109136451], [CAD, 142])).tipo, "aprovou");
  assert.equal(classificarEvento(ev(1, [A, 109141063], [A, KOMMO.KIT_LIBERADO])).tipo, "liberou");
  assert.equal(classificarEvento(ev(1, [A, 109141063], [A, 143])).tipo, "etapa");
  assert.equal(classificarEvento(ev(1, [A, 109141059], [CAD, 109136451])).tipo, "desfez");
  assert.equal(classificarEvento(ev(1, [CAD, 109136447], [CAD, 109138199])), null);
  assert.equal(classificarEvento(ev(1, [14185627, 1], [14185627, 142])), null);   // outro funil (Link de pagamento)
});
t("valores do kit e opção", () => {
  assert.equal(reais("R$ 5.000"), 5000); assert.equal(reais("R$ 5.000,50"), 5000.5); assert.equal(reais("7000.00"), 7000); assert.equal(reais(""), 0);
  const l = lead(1, [f(C.kitOpcao, "Vir na empresa + expositor"), f(C.kitCasa, "R$ 5.000"), f(C.kitEmpresa, "R$ 8.000")]);
  assert.deepEqual(kitDoLead(l, 7000), { valor: 8000, empresa: true, expositor: true, opcao: "Vir na empresa + expositor" });
  assert.equal(kitDoLead(lead(2, [f(C.kitOpcao, "Kit normal"), f(C.kitCasa, "R$ 5.000"), f(C.kitEmpresa, "R$ 8.000")]), 7000).valor, 5000);
  assert.equal(kitDoLead(lead(3, []), 7000).valor, 7000);
});
t("entrada no vocabulário da planilha", () => {
  assert.equal(entradaDoLead(lead(1, [f(C.anuncio, "120251989668640131")], ["FACEBOOK ADS"])).ent, "120251989668640131");
  assert.equal(entradaDoLead(lead(1, [f(C.indicadoraNome, "Ana Souza"), f(C.indicadoraId, "10045")], ["INDICAÇÃO", "FORMS"])).obs2, "Indicada por Ana Souza #10045");
  assert.equal(entradaDoLead(lead(1, [], ["INDICAÇÃO"])).ent, "Indicação");
  assert.equal(entradaDoLead(lead(1, [], ["GOOGLE ADS"])).ent, "Google");
  assert.equal(entradaDoLead(lead(1, [], ["FORMS"])).ent, "Formulário");
  assert.equal(entradaDoLead(lead(1, [])).ent, "Kommo");
});
t("cidade, região e telefone", () => {
  assert.equal(cidadeLimpa("Curitiba, PR"), "Curitiba"); assert.equal(cidadeLimpa("são josé dos pinhais"), "São José dos Pinhais");
  assert.equal(regiaoDaCidade("Ponta Grossa"), "Ponta Grossa"); assert.equal(regiaoDaCidade("Paranaguá"), "Litoral do Paraná"); assert.equal(regiaoDaCidade("Pinhais"), "Curitiba e região");
  assert.equal(telefoneDoContato(contato(1, "+55 (41) 99876-5432")), "41998765432");
});

const dadosDe = (leads) => ({ leads: Object.fromEntries(leads.map((l) => [l.id, l])), contatos: Object.fromEntries(leads.map((l) => [900 + l.id, contato(900 + l.id, "4199900" + String(l.id % 10000).padStart(4, "0"))])), etapas, padrao: 7000 });
const cls = (...es) => es.map(classificarEvento);

t("aprovou → Cadastrada com os dados da Kommo; repetir não duplica", () => {
  const l = lead(27001, [f(C.nome, "Maria Teste"), f(C.cidade, "Curitiba, PR"), f(C.endereco, "Rua A, 10 - Cajuru"), f(C.kitOpcao, "Kit normal + expositor"), f(C.kitCasa, "R$ 6.000"), f(C.respAnalise, "Nickolas")], ["FORMS"]);
  const evs = cls(ev(27001, [CAD, 109136451], [A, 109141059], 1795600000));
  const r1 = aplicarEventos({}, evs, dadosDe([l]));
  const k = r1.chaves.r_LK27001;
  assert.equal(r1.resumo.criados, 1);
  assert.equal(k.st, "cadastrada"); assert.equal(k.val, 6000); assert.equal(k.obs, "EXPOSITOR"); assert.equal(k.bai, "Cajuru"); assert.equal(k.tel, "41999007001");
  assert.equal(k.op, "Nickolas"); assert.equal(k.ent, "Formulário"); assert.equal(k.kEt, "cadastro aprovado"); assert.equal(k.reg, "Curitiba e região"); assert.equal(k.rep, "");
  const r2 = aplicarEventos(r1.chaves, evs, dadosDe([l]));
  assert.equal(Object.keys(r2.chaves).length, 0);
});
t("liberou na Kommo → passa para Liberado; kit mexido não volta etapa", () => {
  const l = lead(27002, [f(C.nome, "Joana")]);
  const base = aplicarEventos({}, cls(ev(27002, [CAD, 1], [A, 109141059], 1795600000)), dadosDe([l])).chaves;
  const r = aplicarEventos(base, cls(ev(27002, [A, 109141063], [A, KOMMO.KIT_LIBERADO], 1795690000)), dadosDe([l]));
  assert.equal(r.chaves.r_LK27002.st, "liberado"); assert.equal(r.chaves.r_LK27002.lib, "2026-11-26"); assert.equal(r.chaves.r_LK27002.cad, "2026-11-25");
  assert.equal(r.resumo.liberados, 1);
  const solicitado = { r_LK27002: Object.assign({}, r.chaves.r_LK27002, { st: "solicitado" }) };
  const r3 = aplicarEventos(solicitado, cls(ev(27002, [A, 109141063], [A, KOMMO.KIT_LIBERADO])), dadosDe([l]));
  assert.equal((r3.chaves.r_LK27002 || solicitado.r_LK27002).st, "solicitado");
});
t("lead sem kit que chega em kit liberado entra direto em Liberado", () => {
  const l = lead(27003, [f(C.nome, "Clara")]);
  const r = aplicarEventos({}, cls(ev(27003, [A, 109141063], [A, KOMMO.KIT_LIBERADO])), dadosDe([l]));
  assert.equal(r.chaves.r_LK27003.st, "liberado"); assert.ok(r.chaves.r_LK27003.lib);
});
t("mesma revendedora da planilha (telefone ou nome) não ganha outro kit: só recebe o número do lead", () => {
  const plan = { r_K11_9: { id: "K11-9", nome: "ANA  Paula", tel: "41999007004", cad: "2026-11-20", st: "liberado", hist: [] } };
  const l = lead(27004, [f(C.nome, "Ana Paula")]);
  const r = aplicarEventos(plan, cls(ev(27004, [CAD, 1], [A, 109141059])), dadosDe([l]));
  assert.equal(r.resumo.criados, 0); assert.equal(r.resumo.vinculados, 1); assert.equal(r.chaves["r_K11-9"].kId, 27004);
  const porNome = { r_K11_8: { id: "K11-8", nome: "Bia Lima", tel: "", cad: "2026-11-20", st: "liberado", hist: [] } };
  const r2 = aplicarEventos(porNome, cls(ev(27005, [CAD, 1], [A, 109141059])), dadosDe([lead(27005, [f(C.nome, "bia lima")])]));
  assert.equal(r2.resumo.criados, 0); assert.equal(r2.chaves["r_K11-8"].kId, 27005);
});
t("aprovação desfeita: cancela só o que ninguém mexeu", () => {
  const l = lead(27006, [f(C.nome, "Duda")]);
  const base = aplicarEventos({}, cls(ev(27006, [CAD, 1], [A, 109141059])), dadosDe([l])).chaves;
  const r = aplicarEventos(base, cls(ev(27006, [A, 109141059], [CAD, 109136451])), dadosDe([l]));
  assert.equal(r.chaves.r_LK27006.st, "cancelado"); assert.equal(r.resumo.desfeitos, 1);
  const mexido = { r_LK27006: Object.assign({}, base.r_LK27006, { hist: base.r_LK27006.hist.concat([{ quem: "Michele", txt: "Editou" }]) }) };
  const r2 = aplicarEventos(mexido, cls(ev(27006, [A, 109141059], [CAD, 109136451])), dadosDe([l]));
  assert.equal(r2.chaves.r_LK27006.st, "cadastrada"); assert.equal(r2.chaves.r_LK27006.kEt, "Aprovação desfeita");
});
t("excluído pela Diretoria não volta; etapa da Kommo vira etiqueta", () => {
  const exc = { r_LK27007: { id: "LK27007", kId: 27007, excluido: true, hist: [] } };
  assert.equal(Object.keys(aplicarEventos(exc, cls(ev(27007, [CAD, 1], [A, 109141059])), dadosDe([lead(27007, [])])).chaves).length, 0);
  const base = aplicarEventos({}, cls(ev(27008, [CAD, 1], [A, 109141059])), dadosDe([lead(27008, [f(C.nome, "Eva")])])).chaves;
  const r = aplicarEventos(base, cls(ev(27008, [A, 109141059], [A, 109141063])), dadosDe([]));
  assert.equal(r.chaves.r_LK27008.kEt, "contato de referência"); assert.equal(r.chaves.r_LK27008.st, "cadastrada");
});
t("lead apagado na Kommo (sem dados) fica de fora e aparece no resumo", () => {
  const r = aplicarEventos({}, cls(ev(27009, [CAD, 1], [A, 109141059])), dadosDe([]));
  assert.deepEqual(r.resumo.semDados, [27009]); assert.equal(Object.keys(r.chaves).length, 0);
});
t("aprovado e desfeito na mesma leitura: nem entra", () => {
  const r = aplicarEventos({}, cls(ev(27010, [CAD, 1], [A, 109141059], 1795600000), ev(27010, [A, 109141059], [CAD, 109136451], 1795600100)), dadosDe([lead(27010, [f(C.nome, "Gabi")])]));
  assert.equal(Object.keys(r.chaves).length, 0); assert.equal(r.resumo.criados, 0);
});
console.log("\n" + ok + " testes passaram.");
