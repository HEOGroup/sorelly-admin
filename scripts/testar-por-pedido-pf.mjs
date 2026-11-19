// Teste do CONTROLE E RELATÓRIO POR PEDIDO dos Pagamentos a fornecedores (19/11/2026).
// Roda as regras de verdade (domain/pf.js) e o relatório (lib/relatorio-pedidos-pf.js) com um cenário igual ao da Xangai, montado na memória.
// Nada vai para o banco. Uso: node scripts/testar-por-pedido-pf.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const P = await jiti.import("@/apps/montagem/domain/pf");
const R = await jiti.import("@/apps/montagem/lib/relatorio-pedidos-pf");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const ciclo = { periodicidade:"custom", cortes:[31], prazoDias:0 };
const pf0 = P.pfVazio();
pf0.fornecedores = [{ id:23, nome:"Xangai", tipo:"fornecedor", cat:"Fornecedor de peças", cnpj:"", formas:Object.keys(P.FORMAS), ciclo }, { id:24, nome:"Outro Fornecedor", tipo:"fornecedor", cat:"Fornecedor de peças", cnpj:"", formas:Object.keys(P.FORMAS), ciclo }];
pf0.pedidos = [
  { id:137, fornId:23, numero:"XANGAI — FATURA Nº 5499", data:"2026-10-30", total:6859.8, nfTipo:"misto", comNF:2057.95, semNF:4801.85, cnpj:"CNPJ 46", nfNum:"", parcelas:[{ forma:"boleto", venc:"2026-11-30", valor:2057.95, conta:"—", status:"Pendente" }, { forma:"pix_revendedora", venc:"2026-11-30", valor:4801.85, conta:"Pix", status:"Pendente" }] },
  { id:138, fornId:23, numero:"ROMANEIO N.º 005457", data:"2026-10-22", total:12859.5, nfTipo:"misto", comNF:3857.85, semNF:9001.65, cnpj:"CNPJ 59", nfNum:"", parcelas:[{ forma:"pix_revendedora", venc:"2026-11-19", valor:9001.65, conta:"—", status:"Pendente" }, { forma:"boleto", venc:"2026-11-21", valor:3857.85, conta:"—", status:"Pendente" }] },
  { id:139, fornId:23, numero:"PEDIDO DEZEMBRO", data:"2026-11-25", total:2000, nfTipo:"sem", comNF:0, semNF:2000, cnpj:"Sem NF", nfNum:"", parcelas:[{ forma:"pix_revendedora", venc:"2026-12-31", valor:2000, conta:"—", status:"Pendente" }] },
  { id:140, fornId:24, numero:"OUTRO 1", data:"2026-11-01", total:1000, nfTipo:"sem", comNF:0, semNF:1000, cnpj:"Sem NF", nfNum:"", parcelas:[{ forma:"pix_revendedora", venc:"2026-11-30", valor:1000, conta:"—", status:"Pendente" }] }];
pf0.seq = { L:2000, F:25, P:141, Pg:1, mqP:1, mqB:1 };
let s = { pf:pf0, usuario:16 };
const run = (op, dados) => { const r = P.pfReduz(s, Object.assign({ type:"PF", op, por:"Teste" }, dados)); if(r.patch && r.patch.pf) s = { pf:r.patch.pf, usuario:16 }; return r; };
const passou = (r) => !!(r.patch && r.patch.pf);
const CH = "23|2026-11-30", lanc = (id) => s.pf.lancamentos.find((l) => l.id===id), ult = () => s.pf.lancamentos[s.pf.lancamentos.length-1];
const total = () => P.janelaPorChave(s.pf, CH).total, pago = () => P.pagoJanela(s.pf, CH);

console.log("1. Opção por fornecedor");
t("desligada por padrão (Xangai e outros)", !P.porPedidoAtivo(s.pf, 23) && !P.porPedidoAtivo(s.pf, 24));
const totAntes = total();
t("acerto de 30/11 = parte Pix dos 2 pedidos (dívida vem das Negociações)", Math.abs(totAntes-(4801.85+9001.65))<0.01, totAntes);
t("sem a opção, lançar com pedido é recusado", !passou(run("lanc_add", { chave:CH, data:"2026-11-10", revendedora:"Ana", valor:100, alocs:[{ pedidoId:137, valor:100 }] })));
t("ligar na Xangai (id 23)", passou(run("forn_por_pedido", { id:23, ativo:true })) && P.porPedidoAtivo(s.pf, 23) && !P.porPedidoAtivo(s.pf, 24));
t("outro fornecedor continua igual", !P.porPedidoAtivo(s.pf, 24));
t("ligar não mexe na dívida", Math.abs(total()-totAntes)<0.005);

console.log("2. Pagamento único ligado a um ou vários pedidos");
let r = run("lanc_add", { chave:CH, data:"2026-11-10", revendedora:"Luana", valor:1707.6, alocs:[{ pedidoId:137, valor:1707.6 }] });
const L1 = ult().id;
t("um Pix para um pedido: um registro só", passou(r) && s.pf.lancamentos.length===1 && lanc(L1).alocs.length===1, r.msg);
r = run("lanc_add", { chave:CH, data:"2026-11-11", revendedora:"Camila", valor:3000, alocs:[{ pedidoId:137, valor:1000 }, { pedidoId:138, valor:1500 }] });
const L2 = ult().id;
t("um Pix dividido em 2 pedidos + resto sem identificação", passou(r) && s.pf.lancamentos.length===2 && P.alocado(lanc(L2))===2500 && P.semIdent(lanc(L2))===500, r.msg);
t("total pago no acerto não muda (4.707,60) e a dívida também não", Math.abs(pago()-4707.6)<0.005 && Math.abs(total()-totAntes)<0.005);
t("soma destinada maior que o Pix é recusada", !passou(run("lanc_add", { chave:CH, data:"2026-11-11", revendedora:"X", valor:100, alocs:[{ pedidoId:137, valor:60 }, { pedidoId:138, valor:60 }] })));
t("passar do saldo do pedido sem marcar adiantamento é recusado", !passou(run("lanc_add", { chave:CH, data:"2026-11-12", revendedora:"X", valor:5000, alocs:[{ pedidoId:137, valor:5000 }] })));
t("com adiantamento marcado é aceito", passou(run("lanc_add", { chave:CH, data:"2026-11-12", revendedora:"Y", valor:2200, alocs:[{ pedidoId:137, valor:2200, adiant:true }] })) && ult().alocs[0].adiant===true);
const L3 = ult().id;
t("pedido de outro fornecedor é recusado", !passou(run("lanc_add", { chave:CH, data:"2026-11-12", revendedora:"Z", valor:10, alocs:[{ pedidoId:140, valor:10 }] })));
t("precisão: 0,1 + 0,2 não vira erro de centavo", passou(run("lanc_add", { chave:CH, data:"2026-11-12", revendedora:"W", valor:0.3, alocs:[{ pedidoId:138, valor:0.1 }, { pedidoId:138, valor:0.2 }] }))===false && passou(run("lanc_add", { chave:CH, data:"2026-11-12", revendedora:"W", valor:0.3, alocs:[{ pedidoId:138, valor:0.3 }] })));
run("lanc_del", { id:ult().id });

console.log("3. Saldos por pedido e valor ainda não identificado");
let r137 = P.resumoPedidoPf(s.pf, 137), r138 = P.resumoPedidoPf(s.pf, 138);
t("fatura 5499: pago identificado 1.707,60 + 1.000 + 2.200", Math.abs(r137.pagoPix-4907.6)<0.005, r137.pagoPix);
t("romaneio 5457: pago identificado 1.500", Math.abs(r138.pagoPix-1500)<0.005);
t("saldo = valor − pago − boleto pago (nunca soma dívida de novo)", Math.abs(r138.saldo-(12859.5-1500))<0.005 && Math.abs(r137.saldo-(6859.8-4907.6))<0.005);
let a = P.acertoPorPedido(s.pf, CH);
t("acerto mostra 2 pedidos e \"Valor ainda não identificado por pedido\" = 500", a.pedidos.length===2 && Math.abs(a.naoIdentificado-500)<0.005, a.naoIdentificado);

console.log("4. Identificação posterior de pagamento antigo");
run("forn_por_pedido", { id:23, ativo:false });
run("lanc_add", { chave:CH, data:"2026-11-13", revendedora:"Antigo", valor:866.6 }); const LA = ult().id;
run("forn_por_pedido", { id:23, ativo:true });
t("pagamento antigo fica sem pedido (nada automático)", !lanc(LA).alocs);
const confAntes = lanc(LA).conferido;
t("identificar depois", passou(run("lanc_pedidos", { id:LA, alocs:[{ pedidoId:138, valor:866.6 }] })) && lanc(LA).alocs[0].pedidoId===138);
t("histórico registrado e conferência não muda", lanc(LA).pedHist.length===1 && lanc(LA).conferido===confAntes);
t("corrigir para outro pedido", passou(run("lanc_pedidos", { id:LA, alocs:[{ pedidoId:137, valor:866.6, adiant:true }] })) && lanc(LA).alocs[0].pedidoId===137 && lanc(LA).pedHist.length===2);
t("tirar a identificação", passou(run("lanc_pedidos", { id:LA, alocs:[] })) && !lanc(LA).alocs && lanc(LA).pedHist.length===3);
t("diminuir o valor abaixo do destinado é recusado", !passou(run("lanc_set", { id:L2, patch:{ valor:1000 } })));
t("conferir continua separado de identificar", passou(run("lanc_conferido", { id:L1, conferido:true })) && lanc(L1).alocs.length===1);

console.log("5. Ajuste (desconto) identificado sem novo abatimento");
t("data sem desconto da maquininha: identificar é recusado", !passou(run("ajuste_pedido", { chave:CH, pedidoId:137 })));

console.log("6. Histórico do pedido em acertos diferentes");
const CH12 = "23|2026-12-31";
t("pagamento em dezembro para o pedido de dezembro", passou(run("lanc_add", { chave:CH12, data:"2026-12-05", revendedora:"Dez", valor:500, alocs:[{ pedidoId:139, valor:500 }] })));
t("pedido de novembro recebe Pix lançado no acerto de dezembro", passou(run("lanc_add", { chave:CH12, data:"2026-12-06", revendedora:"Dez2", valor:300, alocs:[{ pedidoId:138, valor:300 }] })));
r138 = P.resumoPedidoPf(s.pf, 138);
t("o pedido reúne pagamentos de acertos diferentes e o período fica explícito", r138.pagos.length===2 && r138.periodo.de==="2026-10-22" && r138.periodo.ate==="2026-12-06", JSON.stringify(r138.periodo));

console.log("7. Relatório por pedido, mensagem e link restrito");
const html = R.htmlPedidos(s.pf, 23, [138], () => "/comp");
t("só o pedido escolhido (não aparece a fatura 5499 nem o fechamento)", /005457/.test(html) && !/5499/.test(html) && !/Total do período/.test(html));
t("Pix dividido: valor total da transferência e valor destinado", /Valor total da transferência: R\$\s?3\.000,00/.test(html) && /Valor destinado a este pedido: R\$\s?1\.500,00/.test(html));
t("aviso de escopo exclusivo", html.indexOf(R.AVISO_ESCOPO)>=0);
const msg = R.msgPedidos(s.pf, 23, [138], "https://x/acerto/abc");
t("mensagem só do pedido, sem saldo geral do fornecedor", /005457/.test(msg) && !/5499/.test(msg) && !/Total do período/.test(msg));
t("link restrito gerado só para o escopo", passou(run("link_pedidos", { fornId:23, pedidos:[138] })));
const tk = Object.keys(s.pf.linksPedido)[0], esc = s.pf.linksPedido[tk];
t("código forte e escopo só com o pedido 138", /^[a-z0-9]{20}$/.test(tk) && esc.pedidos.join(",")==="138" && esc.fornId===23);
t("mesmo escopo reaproveita o código", passou(run("link_pedidos", { fornId:23, pedidos:[138] }))===false || Object.keys(s.pf.linksPedido).length===1);
t("link de pedido de outro fornecedor é recusado", !passou(run("link_pedidos", { fornId:23, pedidos:[140] })));
t("link completo antigo continua igual (tokensAcerto à parte)", Object.keys(s.pf.tokensAcerto).length===0);
const comps = P.pagosDoPedido(s.pf, 138).map((x) => x.l.id);
t("comprovantes do escopo: só os Pix ligados ao pedido", comps.includes(L2) && !comps.includes(L1) && !comps.includes(L3));

console.log("8. Desligar depois de usar preserva tudo");
const antes = JSON.stringify(s.pf.lancamentos.map((l) => l.alocs||null));
t("desligar a opção", passou(run("forn_por_pedido", { id:23, ativo:false })) && !P.porPedidoAtivo(s.pf, 23));
t("vínculos e histórico continuam guardados", JSON.stringify(s.pf.lancamentos.map((l) => l.alocs||null))===antes && s.pf.fornecedores.find((f) => f.id===23).porPedidoHist.length===4 && s.pf.fornecedores.find((f) => f.id===23).porPedidoHist[3].ativo===false);
t("dívida do acerto igual à de antes de tudo", Math.abs(total()-totAntes)<0.005);

console.log("9. Sugerir divisão (só proposta; grava o que for confirmado)");
{
  const pfS = JSON.parse(JSON.stringify(pf0)); pfS.fornecedores[0].porPedido = true;
  const vals = [1707.6, 1000, 1000.28, 1269.6, 1147.2, 736, 1250.4, 866.6];   // os 8 Pix reais da Xangai em 30/11
  pfS.lancamentos = vals.map((v, i) => ({ id:3000+i, chave:CH, fornId:23, mes:"2026-11", limite:"2026-11-30", data:"2026-11-1"+i, revendedora:"R"+i, valor:v, conta:"—", conferido:false, conferidoEm:"" }));
  let s2 = { pf:pfS, usuario:16 };
  const sug = P.sugerirDivisao(s2.pf, CH);
  const soma = (l) => Math.round(l.reduce((a, x) => a+x, 0)*100)/100;
  t("sugestão não grava nada sozinha", s2.pf.lancamentos.every((l) => !l.alocs));
  t("ordem de vencimento: Romaneio (19/11) recebe antes da Fatura (30/11)", sug[0].novas[0].pedidoId===138);
  const porPed = (id) => soma(sug.flatMap((x) => x.novas.filter((n) => n.pedidoId===id).map((n) => n.valor)));
  t("toda a sugestão = total pago (8.977,68), sem passar do saldo do Romaneio (9.001,65)", Math.abs(porPed(138)+porPed(137)-8977.68)<0.01 && porPed(138)<=9001.65+0.005, porPed(138)+" / "+porPed(137));
  t("um Pix pode ser dividido entre pedidos sem virar outro registro", sug.length===8 && s2.pf.lancamentos.length===8);
  const r = P.pfReduz(s2, { type:"PF", op:"lanc_pedidos_lote", por:"Teste", itens:sug.slice(0, 3).map((x) => ({ id:x.l.id, alocs:x.alocs })) });
  t("confirmar só 3: só eles são gravados", r.patch && r.patch.pf && r.patch.pf.lancamentos.filter((l) => l.alocs).length===3, r.msg);
  t("histórico marca que veio da sugestão confirmada", r.patch.pf.lancamentos[0].pedHist[0].sugestao===true);
  s2 = { pf:r.patch.pf, usuario:16 };
  const sug2 = P.sugerirDivisao(s2.pf, CH);
  t("nova sugestão só traz os 5 que faltam e não duplica", sug2.length===5 && !sug2.some((x) => x.l.id<3003));
  const ruim = P.pfReduz(s2, { type:"PF", op:"lanc_pedidos_lote", por:"Teste", itens:[{ id:3003, alocs:[{ pedidoId:138, valor:1 }] }, { id:3004, alocs:[{ pedidoId:138, valor:999999 }] }] });
  t("lote com um item errado: nada é gravado (tudo ou nada)", !(ruim.patch && ruim.patch.pf));
}

console.log("10. Boleto opcional (HTML, link e mensagem) e mensagem no formato normal");
{
  const sem = R.htmlPedidos(s.pf, 23, [138], () => "", {});
  const com = R.htmlPedidos(s.pf, 23, [138], () => "", { boleto:true });
  t("sem marcar: HTML só com Pix (sem boleto)", !/Boleto/.test(sem) && /somente Pix/.test(sem) && /Valor em Pix/.test(sem));
  t("marcado: HTML com o boleto, vencimento e situação", /Boleto · R\$\s?3\.857,85 · vence 21\/11\/2026 · em aberto/.test(com) && /Pix e boleto/.test(com));
  const m1 = R.msgPedidos(s.pf, 23, [138], "https://x/acerto/abc", false), m2 = R.msgPedidos(s.pf, 23, [138], "https://x/acerto/abc", true);
  t("mensagem no formato da normal (Total, Já enviado, Pix enviados, link)", /Segue o acerto do pedido \*ROMANEIO/.test(m1) && /💰 Total do pedido \(Pix\)/.test(m1) && /✅ Já enviado/.test(m1) && /📄 Pix enviados/.test(m1) && /Confira a listagem e os comprovantes aqui:\nhttps:\/\/x\/acerto\/abc/.test(m1));
  t("sem marcar: mensagem sem boleto", !/🧾/.test(m1));
  t("marcado: mensagem com o boleto", /🧾 Boleto: \*R\$\s?3\.857,85\* · vence 21\/11\/2026 · em aberto/.test(m2));
  const cod = P.novoCodigoLink();
  const pfLiga = JSON.parse(JSON.stringify(s.pf)); pfLiga.fornecedores.find((f) => f.id===23).porPedido = true;
  const r1 = P.pfReduz({ pf:pfLiga, usuario:16 }, { type:"PF", op:"link_pedidos", por:"Teste", fornId:23, pedidos:[138], boleto:true, token:cod });
  t("link com boleto usa o código que a tela mandou (o mesmo da mensagem)", r1.patch && r1.patch.pf.linksPedido[cod] && r1.patch.pf.linksPedido[cod].boleto===true);
  t("link com boleto e sem boleto são diferentes", Object.keys(r1.patch.pf.linksPedido).length===2);
}

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
