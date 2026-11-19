// Teste do fluxo Estoque de material → Compras (16/11/2026): foto do material, carrinho vira pedido de Compras com o retrato do estoque,
// andamento lido da compra, histórico do material e recebimento sem entrada duplicada. Roda as regras de verdade, sem navegador e sem banco.
// Uso: node scripts/testar-estoque-compras.mjs   (saída 1 = alguma verificação falhou)
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
// executa uma ação como a tela faz (porId 29 = quem aprova compras)
const run = (op, dados, quem) => { const r = D.ceReduz(s, Object.assign({ type:"CE", op, por:"Teste", porId:quem || 29, podeAutorizar:true }, dados)); if(r.patch && r.patch.ce) s = Object.assign({}, s, { ce:r.patch.ce }); return r; };
const passou = (r) => !!(r.patch && r.patch.ce);
const mat = () => D.materialVisto(s, s.ce.materiais.find((m) => m.material==="BLOCO GARANTIA DO SETOR"));
const logs = (acao) => s.ce.logMateriais.filter((l) => l.material==="BLOCO GARANTIA DO SETOR" && l.acao===acao);

console.log("1. Material e foto");
t("cria categoria", passou(run("mcat_add", { tipoId:"materiais_embalagens", nome:"Cartão garantia teste" })));
const cat = s.ce.matCategorias.find((c) => c.nome==="Cartão garantia teste");
t("cadastra material com foto", passou(run("mat_add", { material:"BLOCO GARANTIA DO SETOR", unidade:"UN", estoqueMinimo:40, categoriaId:cat.id, foto:{ key:"an_teste0001", nome:"bloco.jpg" } })));
t("foto fica ligada ao material", mat().foto && mat().foto.key==="an_teste0001");
t("contagem: saldo 7", passou(run("estoque_contagem", { id:mat().id, valor:7, quem:"Teste", data:hoje })) && mat().estoqueAtual===7);
t("situação do estoque = Crítico", mat().status==="CRITICO");
t("sem compra: selo 'Sem compra em andamento'", mat().andamento.rotulo==="Sem compra em andamento" && !mat().andamento.etapa);
t("troca a foto", passou(run("mat_foto", { id:mat().id, foto:{ key:"an_teste0002", nome:"bloco2.jpg" } })) && mat().foto.key==="an_teste0002");
t("foto inválida é recusada", !passou(run("mat_foto", { id:mat().id, foto:{ key:"../x", nome:"x" } })));
t("histórico: foto incluída e trocada", logs("FOTO_INCLUIDA").length===1 && logs("FOTO_TROCADA").length===1);

console.log("2. Carrinho → pedido de Compras");
const id = mat().id;
let r = run("estoque_pedir", { materialId:id, quantidade:100, observacao:"Acabando" });
t("pedido criado", passou(r), r.msg);
const ped = () => s.ce.pedidos.find((p) => p.origem && p.origem.materialId===id && p.status!=="CANCELADA");
t("pedido na área de Compras (Solicitada)", ped() && ped().status==="NAO_VERIFICADA" && D.listarPedidos(s, { escopo:"funil", limite:500 }).itens.some((p) => p.id===ped().id));
t("item ligado ao material, com nome e unidade", ped().itens[0].materialId===id && ped().itens[0].titulo==="BLOCO GARANTIA DO SETOR" && ped().itens[0].unidade==="UNID");
t("retrato: saldo 7, mínimo 40, quantidade 100, origem estoque", ped().origem.saldo===7 && ped().origem.minimo===40 && ped().origem.quantidade===100 && ped().origem.tipo==="estoque" && ped().origem.por==="Teste");
t("mínimo não virou quantidade", ped().itens[0].quantidade===100);
t("selo do estoque: Solicitado", mat().andamento.rotulo==="Solicitado" && mat().aguardandoDecisao);
t("situação do estoque continua Crítico", mat().status==="CRITICO");
t("histórico: compra pedida", logs("COMPRA_PEDIDA").length===1);
r = run("estoque_pedir", { materialId:id, quantidade:5 });
t("segunda compra sem confirmar é recusada", !passou(r), r.msg);
t("segunda compra confirmada é aceita", passou(run("estoque_pedir", { materialId:id, quantidade:5, forcar:true })));
t("selo mostra +1", mat().andamento.extra===1 && mat().andamento.abertas.length===2);
const segunda = s.ce.pedidos.filter((p) => p.origem && p.origem.materialId===id).sort((a, b) => b.id-a.id)[0];
t("cancela a segunda", passou(run("pedido_cancelar", { id:segunda.id, motivo:"Duplicada no teste" })));
t("depois de cancelar: uma aberta só", mat().andamento.abertas.length===1 && mat().andamento.extra===0);

console.log("3. Andamento muda pela compra (o mesmo registro)");
t("aprovar → Análise financeira (etapa 2)", passou(run("pedido_aprovar", { id:ped().id })) && ped().status==="APROVADA" && mat().andamento.etapa==="ANALISE", ped().status);
run("pedido_set", { id:ped().id, valorEstimado:250 });   // o financeiro informa o valor (fluxo de 18/11/2026: a decisão precisa fechar com o total)
t("liberar sem decisão é recusado", !passou(run("pedido_liberar", { id:ped().id })));
t("liberar com CNPJ e forma → Liberado · a comprar", passou(run("pedido_liberar", { id:ped().id, cnpjId:"34", plano:[{ forma:"pix_empresa", valor:250, vencimento:hoje }] })) && mat().andamento.etapa==="A_COMPRAR", ped().status);
r = run("pedido_comprar", { id:ped().id, valorCompra:250, compradoEm:hoje });
t("compra efetuada → Aguardando entrega", passou(r) && mat().andamento.etapa==="ENTREGA", r.msg);
t("histórico: mudanças de andamento registradas", logs("ANDAMENTO").length>=4, String(logs("ANDAMENTO").length));

console.log("4. Retrato não muda depois");
t("contagem nova (saldo 3)", passou(run("estoque_contagem", { id, valor:3, quem:"Teste", data:hoje })));
t("mínimo muda para 60", passou(run("mat_set", { id, material:"BLOCO GARANTIA DO SETOR", unidade:"UN", estoqueMinimo:60, categoriaId:cat.id })));
t("retrato continua 7 e 40", ped().origem.saldo===7 && ped().origem.minimo===40);

console.log("5. Recebimento");
const it = ped().itens[0];
r = run("pedido_receber", { id:ped().id, itens:[{ itemId:it.id, qtd:60 }], recebidoEm:hoje });
t("recebe 60 de 100", passou(r), r.msg);
t("saldo 3 + 60 = 63", mat().estoqueAtual===63, String(mat().estoqueAtual));
t("selo: Aguardando entrega · falta 40", mat().andamento.rotulo==="Aguardando entrega · falta 40", mat().andamento.rotulo);
t("histórico: recebimento com o que falta", logs("RECEBIMENTO").some((l) => /falta 40/.test(l.detalhe)));
r = run("pedido_receber", { id:ped().id, recebidoEm:hoje });
t("recebe o resto", passou(r), r.msg);
t("saldo 63 + 40 = 103 (sem duplicar)", mat().estoqueAtual===103, String(mat().estoqueAtual));
t("selo: Recebido", mat().andamento.etapa==="RECEBIDO");
t("receber de novo é recusado (nada a receber)", !passou(run("pedido_receber", { id:ped().id, recebidoEm:hoje })) && mat().estoqueAtual===103);
t("situação do estoque volta a OK (103 > 60×130%)", mat().status==="OK", mat().status);
const pid = ped().id;
t("confirmar entrega encerra", passou(run("pedido_entregar", { id:pid, entregueParaNome:"Teste" })));
t("sem compra aberta de novo", mat().andamento.rotulo==="Sem compra em andamento");
t("compra encerrada continua no histórico do material", mat().andamento.todas.some((c) => c.id===pid && !c.aberta));

console.log("6. Remover foto");
t("remove a foto", passou(run("mat_foto", { id, foto:null })) && !mat().foto && logs("FOTO_REMOVIDA").length===1);

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
