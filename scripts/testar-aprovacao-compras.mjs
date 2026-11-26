// Teste do fluxo de aprovação das Compras (18/11/2026): formas de pagamento disponíveis na solicitação, etapa 2 (Análise financeira),
// decisão financeira, "Aprovar e liberar" tudo-ou-nada, mudanças depois de liberar, pedidos antigos e nada de pagamento/estoque na aprovação.
// Roda as regras de verdade, sem navegador e sem banco. Uso: node scripts/testar-aprovacao-compras.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const D = await jiti.import("@/apps/montagem/domain/compras-estoque");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let s = { ce: D.ceDemo() };
const hoje = D.hojeSP();
const run = (op, dados, quem) => { const r = D.ceReduz(s, Object.assign({ type:"CE", op, por:"Teste", porId:quem || 29, podeAutorizar:true }, dados)); if(r.patch && r.patch.ce) s = { ce:r.patch.ce }; return r; };
const passou = (r) => !!(r.patch && r.patch.ce);
const ped = (id) => s.ce.pedidos.find((p) => p.id===id);
const ultimo = () => s.ce.pedidos[s.ce.pedidos.length-1];
const item = (v) => [{ titulo:"Tag teste", quantidade:1000, unidade:"UNID", valorUnitario:v, classificacao:"material" }];
const FD = { opcoes:{ cartao:{ juros:"sim", parcelasMax:6, taxa:"2,5% ao mês" }, boleto:{ parcelas:3, prazos:"30/60/90", ref:"emissao_nf" }, pix_empresa:{ condicao:"à vista" }, pix_revendedora:{ condicao:"na entrega" } } };

console.log("1. Solicitação com formas disponíveis");
t("cartão com juros sem taxa é recusado", !passou(run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:{ opcoes:{ cartao:{ juros:"sim" } } } })));
t("boleto com prazo inválido é recusado", !passou(run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:{ opcoes:{ boleto:{ prazos:"30 e 60" } } } })));
t("sem NF com cartão é recusado", !passou(run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:{ semNF:true, opcoes:{ cartao:{ juros:"nao" } } } })));
t("nenhuma forma marcada é recusado", !passou(run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:{ opcoes:{} } })));
let r = run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:FD });
t("solicitação com 4 formas é aceita (sem CNPJ)", passou(r), r.msg);
const A = ultimo().id;
t("Pix e Pix REV salvos como opções distintas", !!ped(A).formasDisp.opcoes.pix_empresa && !!ped(A).formasDisp.opcoes.pix_revendedora);
t("condições guardadas (cartão 6x com juros, boleto 30/60/90 da nota)", ped(A).formasDisp.opcoes.cartao.parcelasMax===6 && ped(A).formasDisp.opcoes.cartao.juros===true && ped(A).formasDisp.opcoes.boleto.prazos==="30/60/90" && ped(A).formasDisp.opcoes.boleto.ref==="emissao_nf");
t("texto da forma", D.textoFormaDisp("boleto", ped(A).formasDisp.opcoes.boleto)==="Boleto 3x · 30/60/90 dias da emissão da nota", D.textoFormaDisp("boleto", ped(A).formasDisp.opcoes.boleto));
t("sem NF com Dinheiro e Pix REV é aceito", passou(run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:{ semNF:true, opcoes:{ dinheiro:{ condicao:"" }, pix_revendedora:{ condicao:"" } } } })));
const SNF = ultimo().id;

console.log("2. Aprovar → etapa 2 (Análise financeira)");
t("aprovar leva à etapa 2, Definição do CNPJ (não libera)", passou(run("pedido_aprovar", { id:A })) && ped(A).status==="APROVADA" && D.rotuloStatusDe(ped(A))==="Definição do CNPJ");   // 26/11/2026: etapa 2 = Definição do CNPJ
t("pendências: falta CNPJ e falta pagamento", D.pendenciasAnalise(ped(A), s.ce.config).join("|")==="Falta definir CNPJ|Falta definir pagamento");
t("salvar análise só com CNPJ", passou(run("pedido_decisao", { id:A, cnpjId:"34" })) && ped(A).status==="APROVADA");
t("pendência: falta pagamento", D.pendenciasAnalise(ped(A), s.ce.config).join("|")==="Falta definir pagamento");

console.log("3. Liberar exige a decisão financeira");
t("forma fora das disponíveis é recusada (Dinheiro)", !passou(run("pedido_liberar", { id:A, plano:[{ forma:"dinheiro", valor:500, vencimento:hoje }] })));
t("cartão sem dizer se tem juros é recusado", !passou(run("pedido_liberar", { id:A, plano:[{ forma:"cartao", valor:500, vencimento:hoje, parcelas:3 }] })));
t("valor que não fecha com o total é recusado", !passou(run("pedido_liberar", { id:A, plano:[{ forma:"pix_empresa", valor:300, vencimento:hoje }] })));
t("parte sem vencimento e sem prazo é recusada", !passou(run("pedido_liberar", { id:A, plano:[{ forma:"boleto", valor:500 }] })));
t("sem permissão (pessoa sem a autorização) é recusado", !passou(run("pedido_liberar", { id:A, plano:[{ forma:"boleto", valor:500, prazo:"30 dias após a nota" }] }, 999)));
r = run("pedido_liberar", { id:A, plano:[{ forma:"boleto", valor:250, prazo:"30 dias após a emissão da nota", parcelas:1 }, { forma:"pix_revendedora", valor:250, vencimento:hoje }] });
t("liberar com 2 formas (boleto com prazo relativo + Pix REV) → etapa 3", passou(r) && ped(A).status==="LIBERADA", r.msg);
t("decisão guardada (CNPJ, formas, total, quem e quando)", ped(A).decisao && ped(A).decisao.cnpjId==="34" && ped(A).decisao.formas.join(",")==="boleto,pix_revendedora" && ped(A).decisao.total===500 && ped(A).decisao.por==="Teste" && !!ped(A).decisao.em);
t("alternativas do fornecedor continuam guardadas", Object.keys(ped(A).formasDisp.opcoes).length===4);
t("liberar NÃO marca pagamento, recebimento nem estoque", ped(A).plano.every((x) => !x.pago) && !ped(A).pago && !ped(A).recebimentos.length && !s.ce.movimentos.length);

console.log("4. Aprovar e liberar: tudo ou nada");
run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(0.5), formasDisp:FD }); const B = ultimo().id;
t("sem decisão: recusado e o pedido continua Solicitado (sem aprovação parcial)", !passou(run("pedido_aprovar", { id:B, liberar:true })) && ped(B).status==="NAO_VERIFICADA" && !ped(B).aprovadoPor);
t("com decisão completa: aprovado e liberado", passou(run("pedido_aprovar", { id:B, liberar:true, cnpjId:"46", plano:[{ forma:"pix_empresa", valor:500, vencimento:hoje }] })) && ped(B).status==="LIBERADA" && ped(B).decisao.cnpjId==="46");
run("pedido_add", { fornecedorNome:"Gráfica X", itens:item(5), formasDisp:FD }); const C = ultimo().id;   // R$ 5.000: acima do limite
const rC = D.ceReduz(s, { type:"CE", op:"pedido_aprovar", id:C, liberar:true, por:"Teste", porId:29, podeAutorizar:false, cnpjId:"34", plano:[{ forma:"pix_empresa", valor:5000, vencimento:hoje }] });
t("acima do limite sem autorização: recusado, nada muda", !(rC.patch && rC.patch.ce) && ped(C).status==="NAO_VERIFICADA");
t("sem NF: liberar com Pix comum é recusado", passou(run("pedido_aprovar", { id:SNF })) && !passou(run("pedido_liberar", { id:SNF, cnpjId:"sem_nota", plano:[{ forma:"pix_empresa", valor:500, vencimento:hoje }] })));
t("sem NF: liberar com Dinheiro é aceito", passou(run("pedido_liberar", { id:SNF, cnpjId:"sem_nota", plano:[{ forma:"dinheiro", valor:500, prazo:"na entrega" }] })));

console.log("5. Mudanças depois de liberar");
t("trocar CNPJ sem motivo é recusado", !passou(run("pedido_set", { id:A, cnpjId:"46" })) && ped(A).cnpjId==="34");
t("trocar CNPJ com motivo → volta para a Análise financeira", passou(run("pedido_set", { id:A, cnpjId:"46", motivo:"Pagar pelo 46" })) && ped(A).status==="APROVADA" && !ped(A).decisao && ped(A).decisoesHist.length===1 && ped(A).decisoesHist[0].motivo==="Pagar pelo 46");
t("histórico registra a volta", ped(A).eventos.some((e) => /Voltou para a análise financeira/.test(e.texto)));
t("plano acima do aprovado depois de liberar pede motivo", !passou(run("pedido_plano_set", { id:B, plano:[{ forma:"pix_empresa", valor:600, vencimento:hoje }] })));
r = run("pedido_comprar", { id:B, valorCompra:500, compradoEm:hoje });
t("compra efetuada", passou(r) && ped(B).status==="COMPRADA", r.msg);
t("mudar fornecedor depois de comprar: registra divergência, não desfaz", passou(run("pedido_set", { id:B, fornecedorNome:"Outra Gráfica", motivo:"Fornecedor trocou de nome" })) && ped(B).status==="COMPRADA" && ped(B).divergencias.length===1);

console.log("6. Pedidos antigos");
s.ce.pedidos.push(Object.assign(JSON.parse(JSON.stringify(ped(B))), { id:88888, status:"AGUARDANDO_CNPJ", cnpjId:null, cnpj:null, decisao:null, decisoesHist:[], divergencias:[], formasDisp:undefined, plano:[], valorCompra:null, valorEstimado:500, eventos:[] }));
t("pedido antigo em 'Aguard. CNPJ' fica na Análise financeira", D.ETAPA_ANALISE.includes(ped(88888).status) && D.pendenciasAnalise(ped(88888), s.ce.config)[0]==="Falta definir CNPJ");
t("pedido antigo libera pela análise (sem formas disponíveis: qualquer forma)", passou(run("pedido_liberar", { id:88888, cnpjId:"59", plano:[{ forma:"boleto", valor:500, vencimento:hoje }] })) && ped(88888).status==="LIBERADA");
s.ce.pedidos.push(Object.assign(JSON.parse(JSON.stringify(ped(88888))), { id:88889, status:"COMPRADA", cnpjId:"34", cnpj:"CNPJ antigo", decisao:undefined }));
t("CNPJ de pedido antigo continua guardado", ped(88889).cnpj==="CNPJ antigo");

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
