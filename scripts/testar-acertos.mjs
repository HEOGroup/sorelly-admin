// TESTE FINANCEIRO DA CALCULADORA DE ACERTOS (28/11/2026). Confere a conta oficial com valores calculados à mão, sem navegador e sem banco.
// Cobre as regras em vigor (27/10/2026) e as CONDIÇÕES NOVAS de 28/11/2026 (versão 2, ainda sem data de vigência).
// Uso: node scripts/testar-acertos.mjs   (saída 1 = alguma conferência falhou). Não grava nada: usa só o estado de exemplo, em memória.
import { createJiti } from "jiti"; import path from "node:path";
const raiz = process.cwd(); const guard = {};
globalThis.localStorage = { getItem(k){ return guard[k] ?? null; }, setItem(k, v){ guard[k] = v; }, removeItem(k){ delete guard[k]; } };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const C = await jiti.import("@/apps/montagem/domain/consignado");
const { derivarAcerto, contaDoRegistro, conferirRegistro, novaChanceUsada, FORM_ACERTO_VAZIO } = await jiti.import("@/apps/montagem/domain/acerto-derivado");
const { devidoDe, faltaDe } = await jiti.import("@/apps/montagem/domain/comissoes");
const O = await jiti.import("@/apps/montagem/domain/ocorrencias-acerto");
const { regrasAcertoOficiais } = await jiti.import("@/apps/montagem/domain/regras-acerto");

const BR = n => "R$ "+Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
let ok = 0, erro = 0; const falhas = [];
const confere = (nome, obtido, esperado) => { const igual = typeof esperado==="number" ? Math.abs(obtido-esperado)<0.005 : obtido===esperado; if(igual) ok++; else { erro++; falhas.push(nome+": obtido "+(typeof obtido==="number" ? BR(obtido) : obtido)+", esperado "+(typeof esperado==="number" ? BR(esperado) : esperado)); } };
const titulo = t => console.log(t);
const V1 = C.novaVersaoRegras({id:"rv20261027", vigenciaDesde:"2026-10-27"}), V2 = C.versaoCondicoes2();
const hoje = C.hojeIso(), pg = v => ({forma:"pix", valor:v, data:hoje});
const base = (v, form, extra) => Object.assign({versaoBase:v, modalidade:"padrao", especial:null, vez:0, form:Object.assign({}, FORM_ACERTO_VAZIO, form), condicionais:[], autoPecas:true, dividaAnterior:0}, extra||{});
const reg = (ct, form) => Object.assign({tipo:"acerto", data:hoje, modalidade:"padrao", pagamentos:form.pagamentos||[], formSnapshot:Object.assign({}, FORM_ACERTO_VAZIO, form), excedenteBrinde:ct.excedenteBrinde, contaUnica:true, totalAPagar:ct.totalAPagar, cobrancasAParte:ct.cobrancasAParte, memoria:ct.memoria}, ct.res);

titulo("1. Faixas de comissão e brinde, limite por limite (Ouro e Prata, regras em vigor e condições novas)");
const T = {
  "em vigor · Ouro":  [V1, "padrao", [[300,15,0,0],[500,25,44,32],[700,30,88,96],[1000,35,118,122],[1600,40,196,144],[2500,40,312,188],[5000,45,368,232],[7000,45,442,282]]],
  "em vigor · Prata": [V1, "prata",  [[300,20,0,38],[500,30,44,32],[700,35,74,82],[1000,40,112,96],[1600,45,188,122],[2500,45,282,168],[5000,50,344,224],[7000,50,422,262]]],
  "novas · Ouro":     [V2, "padrao", [[300,15,0,0],[500,25,0,44],[700,30,68,82],[1000,35,118,122],[1600,40,196,144],[2500,40,312,188],[5000,45,368,232],[7000,45,442,282]]],
  "novas · Prata":    [V2, "prata",  [[300,20,0,0],[500,30,0,44],[700,35,68,82],[1000,40,112,96],[1600,45,188,122],[2500,45,282,168],[5000,50,344,224],[7000,50,422,262]]]
};
Object.keys(T).forEach(nome => { const [v, mod, tab] = T[nome], ve = C.versaoEfetiva(v, mod);
  tab.forEach((f, i) => { const pontos = [f[0]].concat(tab[i+1] ? [Math.round((tab[i+1][0]-0.01)*100)/100] : [f[0]+5000]);
    pontos.forEach(venda => { const r = C.calcularAcerto({vendaBruta:venda, vez:0}, ve);
      confere(nome+" venda "+BR(venda)+" comissão %", r.comissaoPct, f[1]); confere(nome+" venda "+BR(venda)+" brinde Normal", r.brindeNormal, f[2]); confere(nome+" venda "+BR(venda)+" brinde Select", r.brindeSelect, f[3]); }); });
  const baixo = C.calcularAcerto({vendaBruta:299.99, vez:0}, ve); confere(nome+" venda R$ 299,99 sem comissão", baixo.comissao, 0); confere(nome+" venda R$ 299,99 taxa", baixo.taxaDeslocamento, 35); confere(nome+" venda R$ 299,99 sem brinde", baixo.brindeNormal+baixo.brindeSelect, 0);
  confere(nome+" atendimento interno sem taxa", C.calcularAcerto({vendaBruta:299.99, vez:0, semTaxa:true}, ve).taxaDeslocamento, 0); });

titulo("2. Arredondamento do brinde (por categoria, depois das penalidades)");
let r = C.calcularAcerto({vendaBruta:1600, vez:1, atrasoDias:7}, V2);   // 196 x 0,83 = 162,68 · 144 x 0,83 = 119,52
confere("novas: R$ 162,68 vira R$ 163,00", r.brindeNormal, 163); confere("novas: R$ 119,52 vira R$ 120,00", r.brindeSelect, 120);
r = C.calcularAcerto({vendaBruta:1000, vez:1}, V2); confere("novas: R$ 100,30 vira R$ 100,00", r.brindeNormal, 100); confere("novas: R$ 103,70 vira R$ 104,00", r.brindeSelect, 104);
r = C.calcularAcerto({vendaBruta:1000, vez:1}, V1); confere("em vigor: R$ 100,30 vira R$ 101,00 (para cima)", r.brindeNormal, 101);
r = C.calcularAcerto({vendaBruta:2500, vez:0, valorPago:1425, cobrancas:0}, V2);   // 1.500 de acerto, falta 5% = 80%: 188 x 0,8 = 150,40
confere("novas: R$ 150,40 vira R$ 150,00", r.brindeSelect, 150);

titulo("3. Limites exatos de 5% e 10% de pendência");
const lim = (v, form, pago) => derivarAcerto(base(v, Object.assign({}, form, {pagamentos:[pg(pago)]})));
let f3 = {vendaBruta:2000, materiaisValor:100};   // condições novas: base = 1.200 + 100 de material = 1.300
let d = lim(V2, f3, 1300); confere("novas: pago integral, brinde cheio", d.libN, 196); confere("novas: base da pendência com material", d.baseAcerto, 1300);
d = lim(V2, f3, 1235); confere("novas: falta exatamente 5% = 80%", d.libN, 157); confere("novas: falta exatamente 5% = 80% (Select)", d.libS, 115);
d = lim(V2, f3, 1234.99); confere("novas: falta 5% + R$ 0,01 = 50%", d.libN, 98);
d = lim(V2, f3, 1170); confere("novas: falta exatamente 10% = 50%", d.libN, 98); confere("novas: falta exatamente 10% = 50% (Select)", d.libS, 72);
d = lim(V2, f3, 1169.99); confere("novas: falta 10% + R$ 0,01 = sem brinde", d.libN, 0);
let f3b = {vendaBruta:788};   // em vigor: 788 - 30% = 551,60
d = lim(V1, f3b, 524.02); confere("em vigor: falta exatamente 5% (R$ 27,58 de R$ 551,60) = 80%", d.libN, 71);
d = lim(V1, f3b, 496.44); confere("em vigor: falta exatamente 10% = 50%", d.libN, 44);
d = lim(V1, {vendaBruta:2000, materiaisValor:100}, 1200); confere("em vigor: material fora da base (joias pagas = brinde cheio)", d.libN, 196);

titulo("4. Multa do valor pendente e dívida");
let f4 = {vendaBruta:2000, pagamentos:[pg(1000)]}, ct = contaDoRegistro(base(V2, f4)), rg = reg(ct, f4);
confere("novas: multa de 5% sobre R$ 200,00", ct.res.multaPendente, 10); confere("novas: valor a pagar", ct.totalAPagar, 1210); confere("novas: dívida = valor a pagar", devidoDe(rg), 1210); confere("novas: falta na Inadimplência", faltaDe(rg), 210);
ct = contaDoRegistro(base(V1, f4)); confere("em vigor: multa de 10% sobre R$ 200,00", ct.res.multaPendente, 20); confere("em vigor: valor a pagar", ct.totalAPagar, 1220);
f4 = {vendaBruta:2000, materiaisValor:115, tagsDanificadas:3, pagamentos:[pg(1200)]}; ct = contaDoRegistro(base(V2, f4)); rg = reg(ct, f4);   // pagou só as joias: faltam R$ 130,00 de material e tags
confere("novas: dívida só de material tem multa de 5% (R$ 6,50)", ct.res.multaPendente, 6.5); confere("novas: multa não incide sobre ela mesma", ct.res.multas, 6.5);
confere("novas: valor a pagar", ct.totalAPagar, 1336.5); confere("novas: dívida", devidoDe(rg), 1336.5); confere("novas: falta", faltaDe(rg), 136.5); confere("novas: falta 9,77% = brinde 50%", ct.res.brindeNormal, 98);
ct = contaDoRegistro(base(V1, f4)); rg = reg(ct, f4); confere("em vigor: material não pago é dívida, sem multa", faltaDe(rg), 130);
ct = contaDoRegistro(base(V2, {vendaBruta:2000, pagamentos:[pg(1200)]})); confere("novas: acerto pago por inteiro não tem multa", ct.res.multas, 0);

titulo("5. Brindes: escolha provisória, direito definitivo e diferença com pendência (exemplo da direção)");
const brindes = [{cat:"normal", valor:212, cod:"N1"}, {cat:"bb", valor:154, cod:"BB0001"}], cabem = [{cat:"normal", valor:150, cod:"N2"}, {cat:"bb", valor:110, cod:"BB0002"}];
d = derivarAcerto(base(V2, {vendaBruta:2000, brindes}));
confere("sem pagamento: escolha provisória", d.escolhaProvisoria, true); confere("sem pagamento: direito cheio", d.libN, 196); confere("sem pagamento: diferença provisória", d.excedenteBrinde, 26); confere("sem pagamento: total previsto", d.totalAPagar, 1226);
confere("sem pagamento não é acerto finalizado sem pagamento", derivarAcerto(base(V2, {vendaBruta:2000, brindes}, {finalizado:true})).escolhaProvisoria, false);
d = derivarAcerto(base(V2, {vendaBruta:2000, brindes, pagamentos:[pg(1000)]}));
confere("pagou R$ 1.000,00: sem direito", d.libN+d.libS, 0); confere("pagou R$ 1.000,00: trava a entrega", d.brindeSemDireito, true); confere("pagou R$ 1.000,00: diferença sai da conta", d.excedenteBrinde, 0);
confere("pagou R$ 1.000,00: gravação recusada com brinde", !!contaDoRegistro(base(V2, {vendaBruta:2000, brindes, pagamentos:[pg(1000)]})).bloqueio, true);
ct = contaDoRegistro(base(V2, {vendaBruta:2000, brindes:[], pagamentos:[pg(1000)]}));
confere("brindes retirados: acerto parcial fecha", ct.bloqueio, ""); confere("brindes retirados: pendência de R$ 200,00 + multa", ct.memoria.restante, 210); confere("brindes retirados: nenhuma dívida de brinde", ct.excedenteBrinde, 0);
d = derivarAcerto(base(V2, {vendaBruta:2000, brindes, pagamentos:[pg(1150)]}));
confere("pagou R$ 1.150,00: direito 80%", d.libN, 157); confere("pagou R$ 1.150,00: diferença proibida com pendência", d.excedenteProibido, true); confere("pagou R$ 1.150,00: não cobra a diferença", d.excedenteBrinde, 0); confere("pagou R$ 1.150,00: trava até acertar a escolha", d.brindeSemDireito, true);
ct = contaDoRegistro(base(V2, {vendaBruta:2000, brindes:cabem, pagamentos:[pg(1150)]}));
confere("brindes dentro do direito: fecha", ct.bloqueio, ""); confere("brindes dentro do direito: multa 5% de R$ 50,00", ct.res.multaPendente, 2.5); confere("brindes dentro do direito: valor a pagar", ct.totalAPagar, 1202.5);
d = derivarAcerto(base(V2, {vendaBruta:2000, brindes, pagamentos:[pg(1200)]}));
confere("acerto quitado: diferença permitida", d.excedenteBrinde, 26); confere("acerto quitado: falta só a diferença", d.restanteTotal, 26); confere("acerto quitado: sem trava de direito", d.brindeSemDireito, false);
d = derivarAcerto(base(V2, {vendaBruta:2000, brindes, pagamentos:[pg(1000), pg(226)]})); confere("completou o pagamento: direito volta", d.libN, 196); confere("completou o pagamento: nada falta", d.restanteTotal, 0);
let ant = Infinity, mono = true; for(let pago = 1200; pago>=100; pago -= 25){ const x = derivarAcerto(base(V2, {vendaBruta:2000, brindes, pagamentos:[pg(pago)]})); if(x.libN>ant) mono = false; ant = x.libN; }
confere("direito nunca sobe quando o pagamento cai", mono, true);
d = derivarAcerto(base(V2, {vendaBruta:480, brindes:[{cat:"bb", valor:40, cod:"BB0003"}], pagamentos:[pg(408)]}));   // venda abaixo de R$ 500: sem brinde em nenhuma modalidade
confere("novas: venda abaixo de R$ 500,00 sem brinde", d.libN+d.libS, 0); confere("brinde sem direito não é gravado como entregue", contaDoRegistro(base(V2, {vendaBruta:480, brindes:[{cat:"bb", valor:40, cod:"BB0003"}], pagamentos:[pg(408)]})).brindeBloqueado, true);

titulo("6. Materiais, tags, trocas e crédito de garantia");
d = derivarAcerto(base(V2, {vendaBruta:480, materiaisValor:100, tagsDanificadas:2}));
confere("material não muda a faixa (venda R$ 480,00 = 15%)", d.previaAcerto.comissaoPct, 15); confere("material não entra na venda", d.previaAcerto.vendaLiquida, 480); confere("material e tags sem comissão no total", d.totalAPagar, 408+100+10);
d = derivarAcerto(base(V2, {vendaBruta:1000, garantia:300})); confere("garantia reduz a venda antes da faixa (R$ 700,00 = 30%)", d.previaAcerto.comissaoPct, 30); confere("garantia usada", d.garantiaUsada, 300); confere("garantia sem sobra", d.garantiaSobra, 0);
d = derivarAcerto(base(V2, {vendaBruta:1000, garantia:1200})); confere("crédito maior que a venda: usa só a venda", d.garantiaUsada, 1000); confere("crédito maior que a venda: sobra para depois", d.garantiaSobra, 200); confere("crédito maior que a venda: comissão zero, nunca negativa", d.previaAcerto.comissao, 0);
ct = contaDoRegistro(base(V2, {vendaBruta:1000, garantia:1200, pagamentos:[pg(35)]})); confere("sobra de garantia vai para o registro", ct.garantiaSobra, 200); confere("crédito não é consumido duas vezes", ct.memoria.garantiaUsada+ct.memoria.garantiaSobra, 1200);
d = derivarAcerto(base(V2, {vendaBruta:950, trocas:[{tipo:"anterior", novaValor:150, antigaValor:100}]})); confere("troca com diferença para mais sobe a venda", d.vendaEfetiva, 1000); confere("troca para mais muda a faixa (35%)", d.previaAcerto.comissaoPct, 35);
d = derivarAcerto(base(V2, {vendaBruta:1010, trocas:[{tipo:"anterior", novaValor:80, antigaValor:100}]})); confere("troca com diferença para menos desce a venda", d.vendaEfetiva, 990); confere("troca para menos muda a faixa (30%)", d.previaAcerto.comissaoPct, 30);

titulo("7. Dívida anterior e pagamento conjunto");
d = derivarAcerto(base(V2, {vendaBruta:2000, pagamentos:[pg(1500)]}, {dividaAnterior:300}));
confere("pagamento único quita a dívida antiga primeiro", d.abateDivida, 300); confere("o resto paga o acerto: brinde cheio", d.libN, 196); confere("nada falta", d.restanteTotal, 0);
d = derivarAcerto(base(V2, {vendaBruta:2000, pagamentos:[pg(1300)]}, {dividaAnterior:300}));
confere("dinheiro da dívida antiga não conta no acerto atual", d.libN, 0); confere("falta do acerto atual", d.faltaAtual, 200); confere("devendo duas vezes: sem kit novo", d.kitNovoLiberado, false);

titulo("8. Remarcações, atraso em dias úteis, isenções e feriados de Curitiba");
const pen = (vez, dias) => C.calcularAcerto({vendaBruta:1000, vez, atrasoDias:dias}, V2);
confere("1ª remarcação: 35% - 5", pen(1, 0).comissaoPct, 30); confere("2ª remarcação: 35% - 8 (não soma a 1ª)", pen(2, 0).comissaoPct, 27); confere("3ª remarcação: 35% - 15", pen(3, 0).comissaoPct, 20); confere("5ª remarcação repete a 3ª", pen(5, 0).comissaoPct, 20);
confere("3ª remarcação: sem brinde", pen(3, 0).brindeNormal+pen(3, 0).brindeSelect, 0);
confere("até o 5º dia útil sem perda", pen(0, 5).comissaoPct, 35); confere("6º dia útil: -1", pen(0, 6).comissaoPct, 34); confere("30º dia útil: -25", pen(0, 30).comissaoPct, 10); confere("31º dia útil: perde tudo", pen(0, 31).comissao, 0); confere("31º dia útil: caso para análise do Jurídico", pen(0, 31).juridico, true);
r = pen(2, 10); confere("2ª remarcação + 10º dia útil: 35 - 8 - 5", r.comissaoPct, 22); confere("brinde Normal 118 x 0,45 = 53", r.brindeNormal, 53); confere("brinde Select 122 x 0,45 = 55", r.brindeSelect, 55);
confere("comissão nunca fica negativa (3ª remarcação + 30º dia útil)", pen(3, 30).comissaoPct, 0);
confere("isenção: só a ocorrência da revendedora pesa", C.vezCobravel([{isenta:true, responsavel:"sorelly"}, {isenta:false, responsavel:"revendedora"}, {isenta:true, responsavel:"representante"}]), 1);
confere("responsável Sorelly não pesa", O.ocorrenciaPesa({responsavel:"sorelly"}), false); confere("responsável representante não pesa", O.ocorrenciaPesa({responsavel:"representante"}), false); confere("motivo sério com prova não pesa", O.ocorrenciaPesa({responsavel:"motivo_serio"}), false); confere("revendedora pesa", O.ocorrenciaPesa({responsavel:"revendedora"}), true);
confere("04/09 a 09/09/2026: fim de semana, 7 de setembro e padroeira de Curitiba = 1 dia útil", O.diasUteisDeAtraso("2026-09-04", "2026-09-09"), 1);
confere("13/11 a 23/11/2026: 15 e 20 de novembro fora = 5 dias úteis", O.diasUteisDeAtraso("2026-11-13", "2026-11-23"), 5);
confere("13/11 a 24/11/2026 = 6 dias úteis (primeiro dia com perda)", O.diasUteisDeAtraso("2026-11-13", "2026-11-24"), 6);
confere("no dia marcado: zero", O.diasUteisDeAtraso("2026-11-13", "2026-11-13"), 0); confere("sem data original: zero, nada inventado", O.diasUteisDeAtraso("", "2026-11-24"), 0);
confere("feriado extra do RH conta", O.diasUteisDeAtraso("2026-11-23", "2026-11-25", {"2026-11-24":"Feriado local"}), 1);
confere("sem pré-acerto conferido", O.preAcertoConferido({}), false); confere("pré-acerto conferido pela representante", O.preAcertoConferido({preAcerto:{conferido:true}}), true);

titulo("9. Venda mínima, nova chance e renovação");
const med = (ants, venda, extra, v) => derivarAcerto(base(v || V1, {vendaBruta:venda, vendasAnteriores:ants, pagamentos:[pg(99999)]}, extra));
d = med([400, 450, 300], 480); confere("média de 4 vendas", d.minimo.media, 407.5); confere("média abaixo de R$ 500,00 bloqueia o kit novo", d.kitNovoLiberado, false); confere("motivo do bloqueio", d.kitNovoRegra.motivo, "media"); confere("nova chance disponível", d.novaChanceDisponivel, true);
d = derivarAcerto(base(V1, {vendaBruta:480, vendasAnteriores:[400, 450, 300], novaChance:true, pagamentos:[pg(99999)]})); confere("nova chance libera o kit", d.kitNovoLiberado, true); confere("nova chance fica marcada", d.novaChanceAplicada, true);
d = derivarAcerto(base(V1, {vendaBruta:480, vendasAnteriores:[400, 450, 300], novaChance:true, pagamentos:[pg(99999)]}, {novaChanceUsada:true})); confere("segunda nova chance não existe", d.kitNovoLiberado, false);
confere("nova chance usada vem do acerto gravado", novaChanceUsada([{rev:"Ana", tipo:"acerto", novaChance:true}, {rev:"Bia", tipo:"acerto"}], "Ana"), true); confere("outra revendedora não usou", novaChanceUsada([{rev:"Ana", tipo:"acerto", novaChance:true}], "Bia"), false);
d = med([0, 900, 900], 600); confere("venda zero entra na média", d.minimo.media, 600); confere("média de R$ 600,00 libera", d.kitNovoLiberado, true);
d = med([], 480); confere("menos de 4 vendas: usa as que existem", d.minimo.qtd, 1); confere("uma venda de R$ 480,00 bloqueia", d.kitNovoLiberado, false);
d = med([650], 700, {semTaxa:true}); confere("atendimento interno: referência R$ 700,00", d.minimo.ref, 700); confere("média R$ 675,00 bloqueia no interno", d.kitNovoLiberado, false);
d = med([650], 700); confere("representante: referência R$ 500,00", d.minimo.ref, 500); confere("média R$ 675,00 libera com representante", d.kitNovoLiberado, true);
d = derivarAcerto(base(V2, {vendaBruta:2000, vendasAnteriores:[2000, 2000, 2000], pagamentos:[pg(950)]})); confere("menos de 80% pago: kit novo só com o financeiro", d.kitNovoRegra.motivo, "pagamento");

titulo("10. Peças para o próximo mês");
const pc = (v, venda, acerto, aberto) => C.pecasProximoMes(venda, acerto, aberto, v.pecasProx).liberadas;
[[999.99,0],[1000,10],[2000,15],[3000,20],[5000,35],[6999.99,35],[7000,50],[20000,50]].forEach(x => confere("novas: venda "+BR(x[0])+" = "+x[1]+" peças", pc(V2, x[0], 1000, 0), x[1]));
confere("em vigor: venda R$ 7.000,00 = 35 peças", pc(V1, 7000, 1000, 0), 35);
confere("quitado = 100%", pc(V2, 3500, 1000, 0), 20); confere("até 5% = 75%", pc(V2, 3500, 1000, 50), 15); confere("até 10% = 50%", pc(V2, 3500, 1000, 100), 10); confere("acima de 10% = 0", pc(V2, 3500, 1000, 100.01), 0);
confere("35 x 75% = 26,25: arredonda para baixo", pc(V2, 5000, 1000, 50), 26); confere("15 x 50% = 7,5: arredonda para baixo", pc(V2, 2000, 1000, 100), 7);

titulo("11. Vigência, versão aplicada e registros antigos");
confere("condições novas ainda desligadas", C.condicoes2Ativas("2099-12-31"), false); confere("data de vigência vazia", C.VIGENCIA_CONDICOES_2, null);
confere("acerto de hoje usa as regras em vigor", derivarAcerto(base(V1, {vendaBruta:2000})).condicoes, 1); confere("versão do acerto sem data efetiva = a do kit", C.versaoDoAcerto(V1, "2099-12-31"), V1);
confere("versão das condições novas se identifica", derivarAcerto(base(V2, {vendaBruta:2000})).regras.condicoes, 2);
confere("registro antigo não é recalculado", conferirRegistro({contaUnica:false, formSnapshot:{}}, V1).semMemoria, true);
f4 = {vendaBruta:2000, materiaisValor:115, tagsDanificadas:3, pagamentos:[pg(1200)]}; ct = contaDoRegistro(base(V2, f4)); rg = reg(ct, f4);
confere("conferência do registro: conta refeita bate", conferirRegistro(rg, V2).ok, true);
const adulterado = conferirRegistro(Object.assign({}, rg, {comissao:rg.comissao+50, valorDevido:rg.valorDevido-50}), V2);
confere("conferência do registro: número alterado é apontado", adulterado.ok, false); confere("campo apontado", adulterado.divergencias.map(x => x.campo).join(","), "comissao,valorDevido");
confere("memória de cálculo guarda a base", ct.memoria.baseDaPendencia, 1330); confere("memória de cálculo guarda a versão", ct.memoria.regras.id, C.ID_CONDICOES_2);
const of = regrasAcertoOficiais();
confere("leitura das regras: versão vigente", of.versaoVigente.condicoes, 1); confere("leitura das regras: multa em vigor", of.pagamento.multaSobrePendentePct, 10); confere("leitura das regras: condições novas desligadas", of.condicoesNovas.ativas, false);
confere("leitura das regras: multa nova", of.condicoesNovas.pagamento.multaSobrePendentePct, 5); confere("leitura das regras: brinde novo de R$ 500,00 (Select)", of.condicoesNovas.comissaoEBrinde.kitNormal[1].brindeSelect, 44); confere("leitura das regras: só leitura", of.somenteLeitura, true);

titulo("12. Gravação: tela = registro = dívida, sem duplicar");
const { reducer } = await jiti.import("@/apps/montagem/state/reducer"); const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const comKit = () => { const s0 = inicial(); return Object.assign({}, s0, {kits:[{id:"KT-TESTE", rev:"Revendedora de teste", status:"entregue", remarcacoesLista:[], vendas:[]}].concat(s0.kits||[])}); };   // kit só em memória
let s = comKit(); const kit = (s.kits||[]).find(k => k && k.rev && k.status!=="acertado" && C.versaoDoKit(s, k));
if(!kit) { erro++; falhas.push("estado de exemplo sem kit aberto: a gravação não foi testada"); }
else {
  const fG = Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:2000, materiaisValor:115, tagsDanificadas:3, pagamentos:[pg(1200)]});
  const acao = {type:"ACERTO_REGISTRAR", id:kit.id, vendaBruta:2000, valorPago:1200, pagamentos:fG.pagamentos, formSnapshot:fG, tagsDanificadas:3, tagsValor:15};
  const antes = (s.acertosConsignado||[]).length, tela = derivarAcerto({finalizado:true, versaoBase:C.versaoDoKit(s, kit), modalidade:C.modalidadeDe(s, kit.rev), especial:C.comissaoEspecialDe(s, kit.rev), vez:C.vezCobravel(kit.remarcacoesLista), form:Object.assign({}, fG, {kitApoio:null}), condicionais:[], autoPecas:true, dividaAnterior:0});
  s = reducer(s, acao); const gravado = (s.acertosConsignado||[]).find(x => x.kitId===kit.id && x.tipo==="acerto");
  confere("um acerto gravado", (s.acertosConsignado||[]).length-antes, 1);
  if(gravado){ confere("valor a pagar: tela = registro", gravado.totalAPagar, tela.totalAPagar); confere("dívida = valor a pagar", devidoDe(gravado), tela.totalAPagar); confere("falta = restante da tela", faltaDe(gravado), tela.restanteTotal);
    confere("comissão: tela = registro", gravado.comissao, tela.previaAcerto.comissao); confere("registro guarda a memória de cálculo", !!(gravado.memoria && gravado.memoria.regras), true); confere("registro guarda a versão das regras", gravado.regrasCondicoes, 1);
    confere("conferência do registro gravado", conferirRegistro(gravado, C.versaoDoKit(s, kit)).ok, true); }
  s = reducer(s, acao); s = reducer(s, acao); confere("finalizar de novo não grava outro acerto", (s.acertosConsignado||[]).length-antes, 1);
  let s2 = comKit(); const k2 = (s2.kits||[]).find(k => k && k.rev && k.status!=="acertado"), a2 = (s2.acertosConsignado||[]).length;
  const fB = Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:2000, brindes, pagamentos:[pg(1000)]});
  s2 = reducer(s2, {type:"ACERTO_REGISTRAR", id:k2.id, vendaBruta:2000, pagamentos:fB.pagamentos, formSnapshot:fB, brindesLancados:brindes});
  confere("brinde sem direito: o acerto não é gravado", (s2.acertosConsignado||[]).length-a2, 0);
  s2 = reducer(s2, {type:"KIT_PRE_ACERTO", id:k2.id, atrasoDias:6, dataOriginal:"2026-11-13", diasCalculados:6, por:"Teste"});
  s2 = reducer(s2, {type:"KIT_PRE_ACERTO", id:k2.id, atrasoDias:2, dataOriginal:"2026-11-19", justificativa:"Data digitada errada", por:"Teste"});
  const pa = (s2.kits.find(k => k.id===k2.id)||{}).preAcerto || {};
  confere("pré-acerto conferido", !!pa.conferido, true); confere("primeira data preservada", pa.primeiraData, "2026-11-13"); confere("data corrigida vale", pa.dataOriginal, "2026-11-19");
  confere("correção registrada (data e dias)", (pa.edicoes||[]).length, 2); const e0 = (pa.edicoes||[])[0] || {};
  confere("histórico: antes", e0.de, "2026-11-13"); confere("histórico: depois", e0.para, "2026-11-19"); confere("histórico: justificativa", e0.justificativa, "Data digitada errada"); confere("histórico: quem", e0.por, "Teste"); confere("histórico: origem", e0.origem, "manual"); confere("histórico: data e hora", e0.em>0, true);
  s2 = reducer(s2, {type:"KIT_REMARCAR", id:k2.id, responsavel:"sorelly", motivo:"Atraso da própria Sorelly", por:"Teste"}); s2 = reducer(s2, {type:"KIT_REMARCAR", id:k2.id, responsavel:"revendedora", por:"Teste"});
  const lst = (s2.kits.find(k => k.id===k2.id)||{}).remarcacoesLista || [];
  confere("ocorrência da Sorelly não pesa, a da revendedora pesa", C.vezCobravel(lst), 1); confere("responsável gravado na ocorrência", lst.map(x => x.responsavel).join(","), "sorelly,revendedora");
  s2 = reducer(s2, {type:"REGRAS_CONSIGNADO_ATUALIZAR", campos:{faixas:[{min:300, pct:99, bn:0, bb:0}]}}); confere("regra não muda mais pelo navegador", (s2.regrasConsignado.versoes||[]).length, 1);
}

console.log("\nRESUMO: "+ok+" certos, "+erro+" errados"); if(falhas.length){ console.log(falhas.map(x => "  ERRO "+x).join("\n")); process.exit(1); }
