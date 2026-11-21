// Teste do cruzamento do Pix da DevMaster com o Pix da Família (domain/cruzamento-pix.js) e do servidor (src/server/cruzamento-pix.js, com banco de mentira).
// Uso: node scripts/testar-cruzamento-pix.mjs
import { cruzarPix, donosDaForma, rotuloContaFamilia, nomeCombina } from "../src/apps/montagem/domain/cruzamento-pix.js";
import { cruzar } from "../src/server/cruzamento-pix.js";

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if (cond) ok++; else { falha++; console.log("  FALHOU: " + nome + (extra ? " → " + extra : "")); } };

const PERSONAS = [{ id: "marcus", nome: "Marcus", tipo: "SOCIO" }, { id: "anabeatriz", nome: "Ana Beatriz", tipo: "SOCIO" }, { id: "familia", nome: "Casa/Família", tipo: "FAMILIAR" }, { id: "anamaria", nome: "Anamaria", tipo: "SOCIO" }];
const CONTAS = [
  { id: "c1", nome: "Conta Truck Plaza", personaId: "marcus" }, { id: "c2", nome: "Conta Higor Seguraça", personaId: "marcus" }, { id: "c3", nome: "Conta Marcus — Nubank", personaId: "marcus" },
  { id: "c4", nome: "Conta Ana Beatriz - Sicredi", personaId: "anabeatriz" }, { id: "c5", nome: "Conta Anamaria - Caixa", personaId: "familia" }, { id: "c6", nome: "Nubank — Conta Diego", personaId: "marcus" },
];
const px = (id, data, valor, origem, personaId, contaId, extra) => Object.assign({ id, data, valor, origem, personaId, contaId, auditoria: "PENDENTE" }, extra || {});
const tit = (rid, rev, d, valor, forma) => ({ rid, rev, d, valor, forma });

console.log("1) nomes das contas (padrão: dono · conta, sem \"Conta\", bolinha no lugar do traço)");
const L = (id) => rotuloContaFamilia(CONTAS.find((c) => c.id === id), PERSONAS);
t("Truck Plaza do Marcus", L("c1") === "Marcus · Truck Plaza", L("c1"));
t("Higor do Marcus", L("c2") === "Marcus · Higor Seguraça", L("c2"));
t("o dono não repete (Conta Marcus — Nubank)", L("c3") === "Marcus · Nubank", L("c3"));
t("conta da Ana Beatriz", L("c4") === "Ana Beatriz · Sicredi", L("c4"));
t("conta da casa fica só com o nome (sem Casa/Família)", L("c5") === "Anamaria · Caixa", L("c5"));
t("o nome do dono no fim também sai (Greicy Anamaria → Greicy)", rotuloContaFamilia({id:"g",nome:"Greicy Anamaria",personaId:"anamaria"}, PERSONAS)==="Anamaria · Greicy", rotuloContaFamilia({id:"g",nome:"Greicy Anamaria",personaId:"anamaria"}, PERSONAS));
t("palavra Conta no meio sai", L("c6") === "Marcus · Nubank · Diego", L("c6"));

console.log("2) quem recebeu pela forma da DevMaster");
t("Marcus", donosDaForma("PIX - MARCUS HESS - PF").join() === "marcus");
t("Ana Beatriz", donosDaForma("PIX - ANA BEATRIZ - PF").join() === "anabeatriz");
t("Anamaria aceita a conta da casa", donosDaForma("PIX - CAIXA ECONÔMICA - ANAMARIA").indexOf("familia") >= 0);
t("banho não é sócio", donosDaForma("PIX - BANHO") === null);

console.log("3) nome da revendedora");
t("Karine Thauany × nome inteiro combina (3 = igual)", nomeCombina(["karine", "thauany"], ["karine", "thauany", "batista", "souza"]) === 3);
t("nomes diferentes não combinam", nomeCombina(["marina", "silva"], ["carla", "silva"]) === 0);
t("uma palavra só combina fraco", nomeCombina(["karine"], ["karine", "thauany"]) === 1);
t("inicial no meio combina (Bortotti × B)", nomeCombina(["nathalia", "gabriela", "bortotti", "souza"], ["nathalia", "gabriela", "b", "souza"]) === 2);
t("letra trocada no primeiro nome combina (Jeiniffer × Jeniffer)", nomeCombina(["jeiniffer", "gadotti"], ["jeniffer", "gadotti"]) === 2);
t("nome do meio faltando combina (Giovana da Silva Pressel × Giovanna S Pressel)", nomeCombina(["giovana", "silva", "pressel"], ["giovanna", "s", "pressel"]) === 2);
t("sobrenome com letra trocada NÃO combina", nomeCombina(["ana", "souza"], ["ana", "sousa"]) === 0);
t("primeiro nome diferente não combina (Daniele × Rita Maria)", nomeCombina(["daniele", "gagliard"], ["rita", "maria", "gagliardi"]) === 0);

console.log("4) o caso da Karine de outubro: 3 títulos do Marcus no mesmo dia viram 3 contas");
const FF = { personas: PERSONAS, contasBanc: CONTAS, pix: [
  px("p1", "2026-10-20", 200, "Karine Thauany Batista de Souza", "marcus", "c3"),
  px("p2", "2026-10-21", 2100, "Karine Thauany Batista", "marcus", "c1"),
  px("p3", "2026-10-22", 800, "Karine Thauany Batista", "marcus", "c2"),
  px("p4", "2026-10-22", 500, "Karine Thauany Batista de Souza", "anabeatriz", "c4"),
] };
const KN = "Karine Thauany Batista De Souza";
const TT = [tit("a|1", KN, "2026-10-23", 2100, "PIX - MARCUS HESS - PF"), tit("a|2", KN, "2026-10-23", 800, "PIX - MARCUS HESS - PF"), tit("a|3", KN, "2026-10-23", 200, "PIX - MARCUS HESS - PF"), tit("a|4", KN, "2026-10-23", 500, "PIX - ANA BEATRIZ - PF"), tit("a|5", KN, "2026-10-23", 1346, "PIX - BANHO")];
const r = cruzarPix(TT, FF);
t("2.100 → Truck Plaza", r.mapa["a|1"] && r.mapa["a|1"].conta === "Marcus · Truck Plaza", JSON.stringify(r.mapa["a|1"]));
t("800 → Higor", r.mapa["a|2"] && r.mapa["a|2"].conta === "Marcus · Higor Seguraça");
t("200 → Nubank", r.mapa["a|3"] && r.mapa["a|3"].conta === "Marcus · Nubank");
t("500 da Ana Beatriz → conta dela", r.mapa["a|4"] && r.mapa["a|4"].conta === "Ana Beatriz · Sicredi");
t("o Pix do banho não casa com a Família", !r.mapa["a|5"]);
t("todos são \"certo\"", ["a|1", "a|2", "a|3", "a|4"].every((k) => r.mapa[k].certeza === "certo"));
t("nenhum Pix da Família sobra", r.semTitulo.length === 0, JSON.stringify(r.semTitulo));

console.log("5) regras de segurança");
const r5 = cruzarPix([tit("x|1", KN, "2026-10-23", 2100, "PIX - ANA BEATRIZ - PF")], FF);
t("sócio da forma diferente do dono do Pix: casa, mas só como provável e com o motivo", r5.mapa["x|1"] && r5.mapa["x|1"].certeza === "provavel" && /outro sócio/.test(r5.mapa["x|1"].motivo), JSON.stringify(r5.mapa["x|1"]));
const r6 = cruzarPix([tit("x|1", KN, "2026-12-30", 2100, "PIX - MARCUS HESS - PF")], FF);
t("título 70 dias depois do Pix casa só como provável (pagamento atrasado)", r6.mapa["x|1"] && r6.mapa["x|1"].certeza === "provavel", JSON.stringify(r6.mapa["x|1"]));
const r6b = cruzarPix([tit("x|1", KN, "2027-06-30", 2100, "PIX - MARCUS HESS - PF")], FF);
t("título 8 meses depois do Pix não casa", !r6b.mapa["x|1"]);
const r7 = cruzarPix([tit("x|1", "Outra Pessoa Qualquer", "2026-10-23", 2100, "PIX - MARCUS HESS - PF")], FF);
t("outra pessoa com o mesmo valor, sócio e data: casa só como provável (quem pagou pode ter outro nome)", r7.mapa["x|1"] && r7.mapa["x|1"].certeza === "provavel" && /outro nome/.test(r7.mapa["x|1"].motivo), JSON.stringify(r7.mapa["x|1"]));
const r7b = cruzarPix([tit("x|1", "Outra Pessoa Qualquer", "2026-10-23", 2100, "PIX - MARCUS HESS - PF"), tit("x|2", "Mais Outra Pessoa", "2026-10-23", 2100, "PIX - MARCUS HESS - PF")], FF);
t("sem o nome, com dois títulos para o mesmo Pix: não casa (dúvida)", !r7b.mapa["x|1"] && !r7b.mapa["x|2"]);
t("Pix \"Itaú PJ Marco\" casa pelo nome com um Pix lançado na conta Itaú Black da Família", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS.concat([{ id: "cb", nome: "Cartão de Créd. Itaú Black", personaId: "familia" }]), pix: [px("b1", "2026-10-09", 723, "Bruna Drielli de Oliveira dos Santos", "familia", "cb")] }; const m = cruzarPix([tit("j|1", "Bruna Drielli De Oliveira Dos Santos", "2026-10-10", 723, "PIX - ITAÚ PJ - MARCO")], f).mapa["j|1"]; return m && m.certeza === "certo" && /Itaú Black/.test(m.conta); })());
t("Itaú PJ sem o nome igual nunca casa só por valor (não é da Família)", !cruzarPix([tit("x|1", "Outra Pessoa Qualquer", "2026-10-23", 2100, "PIX - ITAÚ PJ - MARCO")], FF).mapa["x|1"]);
t("Itaú PJ com o mesmo valor mas outro valor perto não vira \"diferença\"", !cruzarPix([tit("x|1", KN, "2026-10-23", 2090, "PIX - ITAÚ PJ - MARCO")], FF).mapa["x|1"]);
t("a Ana Beatriz lançada na conta da casa casa", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("h1", "2026-08-11", 2500.8, "Jhenny Karoline Santos de Sousa", "familia", "c4")] }; const m = cruzarPix([tit("j|1", "Jhenny Karoline Santos De Sousa", "2026-08-11", 2500.8, "PIX - ANA BEATRIZ - PF")], f).mapa["j|1"]; return m && m.certeza === "certo"; })());
t("Pix lançado na Família 4 dias DEPOIS do título casa como certo", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("h1", "2026-08-07", 175, "Wlliana Felipe da Rocha", "marcus", "c1")] }; const m = cruzarPix([tit("j|1", "Wlliana Felipe Da Rocha", "2026-08-03", 175, "PIX - MARCUS HESS - PF")], f).mapa["j|1"]; return m && m.certeza === "certo"; })());
const r8 = cruzarPix([tit("x|1", KN, "2026-10-23", 2100.5, "PIX - MARCUS HESS - PF")], FF);
t("Pix que casou sai da lista dos sem título; os outros 3 continuam nela", r8.semTitulo.length === 3);
t("Pix sem nenhum título volta na lista", cruzarPix([], FF).semTitulo.length === 4);
t("diferença de R$ 0,50 no valor: casa como \"diferença\" e diz quanto", r8.mapa["x|1"] && r8.mapa["x|1"].certeza === "diferenca" && Math.abs(r8.mapa["x|1"].dif - 0.5) < 0.001, JSON.stringify(r8.mapa["x|1"]));
t("valor muito diferente (R$ 500 a mais) não casa", Object.keys(cruzarPix([tit("x|1", KN, "2026-10-23", 2600, "PIX - MARCUS HESS - PF")], FF).mapa).length === 0);
t("195 na DevMaster × 210 na Família (mesmo dia, mesmo sócio): diferença de R$ 15", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("d1", "2026-08-11", 210, "Deborah Cristine Rumor", "marcus", "c1")] }; const m = cruzarPix([tit("j|1", "Deborah Cristine Rumor Borges", "2026-08-11", 195, "PIX - MARCUS HESS - PF")], f).mapa["j|1"]; return m && m.certeza === "diferenca" && m.dif === -15 && m.valorPix === 210 && m.conta === "Marcus · Truck Plaza"; })());
t("o valor igual sempre ganha da diferença (o Pix de R$ 210 vai para o título de R$ 210, não para o de R$ 195)", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("d1", "2026-08-11", 210, "Deborah Cristine Rumor", "marcus", "c1")] }; const m = cruzarPix([tit("j|1", "Deborah Cristine Rumor Borges", "2026-08-11", 195, "PIX - MARCUS HESS - PF"), tit("j|2", "Deborah Cristine Rumor Borges", "2026-08-12", 210, "PIX - MARCUS HESS - PF")], f).mapa; return m["j|2"] && m["j|2"].certeza !== "diferenca" && !m["j|1"]; })());
t("a diferença com outro sócio não casa", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("d1", "2026-08-11", 210, "Deborah Cristine Rumor", "anabeatriz", "c4")] }; return !cruzarPix([tit("j|1", "Deborah Cristine Rumor Borges", "2026-08-11", 195, "PIX - MARCUS HESS - PF")], f).mapa["j|1"]; })());
// dois Pix iguais, dois títulos iguais: cada um casa com um (nunca dois títulos no mesmo Pix)
const FF2 = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("q1", "2026-10-10", 100, KN, "marcus", "c1"), px("q2", "2026-10-12", 100, KN, "marcus", "c2")] };
const r9 = cruzarPix([tit("y|1", KN, "2026-10-13", 100, "PIX - MARCUS HESS - PF"), tit("y|2", KN, "2026-10-13", 100, "PIX - MARCUS HESS - PF")], FF2);
t("dois iguais: cada Pix casa com um título só", r9.mapa["y|1"] && r9.mapa["y|2"] && r9.mapa["y|1"].pixId !== r9.mapa["y|2"].pixId);
t("dois iguais: fica \"provável\" (pode ter trocado)", r9.mapa["y|1"].certeza === "provavel");
const r10 = cruzarPix([tit("y|1", KN, "2026-10-13", 100, "PIX - MARCUS HESS - PF"), tit("y|2", KN, "2026-10-13", 100, "PIX - MARCUS HESS - PF"), tit("y|3", KN, "2026-10-13", 100, "PIX - MARCUS HESS - PF")], FF2);
t("três títulos para dois Pix: um fica sem par", Object.keys(r10.mapa).length === 2);
const FF3 = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("z1", "2026-10-10", 100, KN, "marcus", "c1", { semAcerto: true })] };
t("Pix marcado \"sem acerto\" (outro recebimento) não entra", Object.keys(cruzarPix([tit("w|1", KN, "2026-10-13", 100, "PIX - MARCUS HESS - PF")], FF3).mapa).length === 0);

console.log("5b) Pix na Família, outra forma na DevMaster");
t("Vanessa: Pix R$ 135 na Família e COMPRA FUNCIONARIOS na DevMaster → \"outra forma\"", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("v1", "2026-10-27", 135, "Vanessa Alves Lapa", "marcus", "c1")] }; const m = cruzarPix([{ rid: "v|1", rev: "Vanessa Alves Lapa", d: "2026-10-27", valor: 135, forma: "COMPRA FUNCIONARIOS", grupo: "Outros" }], f).mapa["v|1"]; return m && m.certeza === "outraforma" && m.formaDm === "COMPRA FUNCIONARIOS" && m.conta === "Marcus · Truck Plaza"; })());
t("Camila: Pix R$ 193 na Família e ACERTO COM LOJA na DevMaster → \"outra forma\"", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("v1", "2026-10-09", 193, "Camila Casagrande", "marcus", "c1")] }; const m = cruzarPix([{ rid: "c|1", rev: "Camila Casagrande Anginski", d: "2026-10-09", valor: 193, forma: "ACERTO - LOJA INTERNO", grupo: "Acerto loja" }], f).mapa["c|1"]; return m && m.certeza === "outraforma"; })());
t("o Pix casa primeiro com o título de Pix; o de outra forma só pega o que sobrou", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("v1", "2026-10-27", 135, "Vanessa Alves Lapa", "marcus", "c1")] }; const m = cruzarPix([{ rid: "o|1", rev: "Vanessa Alves Lapa", d: "2026-10-27", valor: 135, forma: "COMPRA FUNCIONARIOS", grupo: "Outros" }, { rid: "o|2", rev: "Vanessa Alves Lapa", d: "2026-10-27", valor: 135, forma: "PIX - MARCUS HESS - PF", grupo: "Pix" }], f).mapa; return m["o|2"] && m["o|2"].certeza === "certo" && !m["o|1"]; })());
t("título de outra forma com nome diferente não casa", (() => { const f = { personas: PERSONAS, contasBanc: CONTAS, pix: [px("v1", "2026-10-27", 135, "Vanessa Alves Lapa", "marcus", "c1")] }; return !cruzarPix([{ rid: "z|1", rev: "Outra Pessoa Qualquer", d: "2026-10-27", valor: 135, forma: "COMPRA FUNCIONARIOS", grupo: "Outros" }], f).mapa["z|1"]; })());

console.log("6) servidor (banco de mentira)");
const ler = async (m) => (m === "ff" ? FF : m === "contasreceber" ? { antecipados: [{ id: "ra1", ffPixId: "p3" }] } : null);
const eu = { id: "x", perfil: "financeiro" };
const s1 = await cruzar(eu, { itens: TT }, { ler });
t("devolve o mapa", s1.mapa && s1.mapa["a|1"] && s1.mapa["a|1"].conta === "Marcus · Truck Plaza", JSON.stringify(s1).slice(0, 200));
t("sem itens é erro", (await cruzar(eu, {}, { ler })).erro);
t("título inválido é ignorado", Object.keys((await cruzar(eu, { itens: [{ rid: "", rev: "x", d: "2026-10-23", valor: 5 }, { rid: "k", rev: "x", d: "data ruim", valor: 5 }] }, { ler })).mapa).length === 0);
const s2 = await cruzar(eu, { itens: [] , de: "2026-10-01", ate: "2026-10-31" }, { ler: async (m) => (m === "ff" ? FF : { antecipados: [{ id: "ra1", ffPixId: "p3" }] }) });
t("sem título: só o que é da Família e não foi lançado em Contas a receber (se o usuário abre a Família)", Array.isArray(s2.semTitulo), JSON.stringify(s2).slice(0, 100));
const s3 = await cruzar(eu, { itens: TT }, { ler: async () => null });
t("sem Família no servidor: devolve vazio e avisa", s3.semFamilia === true && Object.keys(s3.mapa).length === 0);

console.log("\n" + ok + " ok, " + falha + " com falha");
process.exit(falha ? 1 : 0);
