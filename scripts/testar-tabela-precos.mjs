// Teste da Tabela de preços (etapa 1, 16/11/2026): cadastro, opções de lote e de faixa, contas de unitário e total, travas, histórico,
// arquivar/reativar/excluir e condições do fornecedor. Roda as regras de verdade, sem navegador e sem banco.
// Uso: node scripts/testar-tabela-precos.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const D = await jiti.import("@/apps/montagem/domain/compras-estoque");
const P = await jiti.import("@/apps/montagem/domain/tabela-precos");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let s = { ce: D.ceDemo() };
const run = (op, dados, opera) => { const r = D.ceReduz(s, Object.assign({ type:"CE", op, por:"Teste", porId:17, opera:opera!==false }, dados)); if(r.patch && r.patch.ce) s = { ce:r.patch.ce }; return r; };
const passou = (r) => !!(r.patch && r.patch.ce);
run("forn_add", { nome:"GRÁFICA TESTE" }); const forn = s.ce.fornecedores.find((f) => f.nome==="GRÁFICA TESTE");
run("cat_add", { nome:"Impressos teste" }); const cat = s.ce.categorias.find((c) => c.nome==="Impressos teste");
const prod = () => s.ce.precos.find((p) => p.nome==="TAG TRIO PRATA");

console.log("1. Cadastro com lote fechado");
let r = run("preco_salvar", { fornecedorId:forn.id, nome:"TAG TRIO PRATA", codigo:"TT-01", categoriaId:cat.id, unidade:"MILHEIRO", qtdMinima:2, modelo:"lote",
  opcoes:[{ qtd:5, tipoValor:"total", valor:"1.000,00", prazo:10, prazoUn:"uteis" }, { qtd:2, tipoValor:"unitario", valor:"230,50" }, { qtd:10, tipoValor:"unitario", valor:180 }] });
t("cadastra produto com 3 opções", passou(r), r.msg);
t("sem permissão é recusado", !passou(run("preco_salvar", { fornecedorId:forn.id, nome:"X", unidade:"UNID", modelo:"lote", opcoes:[] }, false)));
const ord = P.opcoesOrdenadas(prod());
t("opções em ordem crescente (2, 5, 10)", ord.map((o) => o.qtd).join(",")==="2,5,10");
const c2 = P.calcOpcao(prod(), ord[0]), c5 = P.calcOpcao(prod(), ord[1]);
t("lote unitário 230,50 × 2 = total 461,00", c2.unit===230.5 && c2.total===461);
t("lote total 1.000,00 ÷ 5 = unitário 200,00", c5.total===1000 && c5.unit===200);
t("milheiro: custo por unidade = 200,00 ÷ 1.000", c5.custoEstoque && Math.abs(c5.custoEstoque.valor-0.2)<1e-9 && /÷ 1\.000/.test(c5.custoEstoque.txt), c5.custoEstoque && c5.custoEstoque.txt);
t("campo vazio fica vazio (prazo sem valor = null)", ord[0].prazo===null && ord[0].prazoUn===null);
t("histórico: produto cadastrado", s.ce.logPrecos.some((l) => l.produtoId===prod().id && l.campo==="Produto cadastrado" && l.por==="Teste"));

console.log("2. Travas");
const base = { fornecedorId:forn.id, nome:"PRODUTO X", unidade:"PACOTE", unidadesPorEmb:100, modelo:"lote" };
t("valor zero é recusado", !passou(run("preco_salvar", Object.assign({}, base, { opcoes:[{ qtd:1, tipoValor:"unitario", valor:0 }] }))));
t("valor vazio é recusado", !passou(run("preco_salvar", Object.assign({}, base, { opcoes:[{ qtd:1, tipoValor:"unitario", valor:"" }] }))));
t("lote repetido é recusado", !passou(run("preco_salvar", Object.assign({}, base, { opcoes:[{ qtd:3, tipoValor:"unitario", valor:1 }, { qtd:3, tipoValor:"total", valor:5 }] }))));
t("sem fornecedor é recusado", !passou(run("preco_salvar", Object.assign({}, base, { fornecedorId:"", opcoes:[] }))));
t("produto repetido no mesmo fornecedor é recusado", !passou(run("preco_salvar", { fornecedorId:forn.id, nome:"tag trio prata", codigo:"tt-01", unidade:"UNID", modelo:"lote", opcoes:[] })));

console.log("3. Faixas");
const fx = { fornecedorId:forn.id, nome:"PLÁSTICO FAIXA", unidade:"PACOTE", unidadesPorEmb:100, modelo:"faixa" };
t("faixas sobrepostas são recusadas", !passou(run("preco_salvar", Object.assign({}, fx, { opcoes:[{ de:1, ate:10, tipoValor:"unitario", valor:5 }, { de:10, ate:null, tipoValor:"unitario", valor:4 }] }))));
t("faixa sem fim que não é a última é recusada", !passou(run("preco_salvar", Object.assign({}, fx, { opcoes:[{ de:1, ate:null, tipoValor:"unitario", valor:5 }, { de:20, ate:30, tipoValor:"unitario", valor:4 }] }))));
t("total sem quantidade de referência é recusado", !passou(run("preco_salvar", Object.assign({}, fx, { opcoes:[{ de:1, ate:10, tipoValor:"total", valor:50 }] }))));
t("referência fora da faixa é recusada", !passou(run("preco_salvar", Object.assign({}, fx, { opcoes:[{ de:1, ate:10, tipoValor:"total", valor:50, qtdRef:20 }] }))));
r = run("preco_salvar", Object.assign({}, fx, { opcoes:[{ de:11, ate:null, tipoValor:"unitario", valor:"0,0125" }, { de:1, ate:10, tipoValor:"total", valor:45, qtdRef:10, prazo:5, prazoUn:"corridos" }] }));
t("faixas válidas (a última sem fim) são aceitas", passou(r), r.msg);
const pf = s.ce.precos.find((p) => p.nome==="PLÁSTICO FAIXA"), of = P.opcoesOrdenadas(pf);
const cf1 = P.calcOpcao(pf, of[0]), cf2 = P.calcOpcao(pf, of[1]);
t("faixa com total 45,00 para 10 → unitário 4,50 e total de referência", cf1.unit===4.5 && cf1.totalRef && cf1.qtdRef===10);
t("faixa sem fim mostra 'ou mais'", cf2.rotulo==="11 ou mais");
t("unitário barato com 4 casas (R$ 0,0125)", P.reaisUnit(cf2.unit)==="R$ 0,0125", P.reaisUnit(cf2.unit));
t("pacote com 100: custo por unidade = 4,50 ÷ 100", Math.abs(cf1.custoEstoque.valor-0.045)<1e-12);

console.log("4. Edição e histórico");
const p0 = prod(), op5 = p0.opcoes.find((o) => o.qtd===5);
r = run("preco_salvar", Object.assign({}, p0, { opcoes:p0.opcoes.map((o) => o.id===op5.id ? Object.assign({}, o, { valor:950 }) : o).filter((o) => o.qtd!==10).concat([{ qtd:20, tipoValor:"unitario", valor:170 }]) }));
t("edita valor, remove uma opção e inclui outra", passou(r), r.msg);
const lg = s.ce.logPrecos.filter((l) => l.produtoId===p0.id);
t("histórico: valor anterior e novo da opção", lg.some((l) => /^Valor \(lote de 5\)/.test(l.campo) && l.antes==="R$ 1.000,00" && l.depois==="R$ 950,00"), JSON.stringify(lg.map((l) => l.campo+": "+l.antes+" → "+l.depois)));
t("histórico: opção removida e opção incluída", lg.some((l) => /removida \(lote de 10\)/.test(l.campo)) && lg.some((l) => /incluída \(lote de 20\)/.test(l.campo)));
t("id da opção editada se mantém", prod().opcoes.some((o) => o.id===op5.id));
const quandoAntes = prod().atualizadoEm;
t("salvar sem mudar nada não grava", run("preco_salvar", Object.assign({}, prod())).msg==="Nada mudou.");
t("arquivar", passou(run("preco_situacao", { id:p0.id, ativo:false })) && prod().ativo===false);
t("arquivar não muda a última atualização comercial", prod().atualizadoEm===quandoAntes);
t("reativar", passou(run("preco_situacao", { id:p0.id, ativo:true })) && prod().ativo===true);
t("histórico: situação", s.ce.logPrecos.some((l) => l.produtoId===p0.id && l.campo==="Situação" && l.antes==="Ativo" && l.depois==="Arquivado"));

console.log("5. Condições do fornecedor e exclusão");
t("valor mínimo do pedido no fornecedor", passou(run("forn_condicoes", { id:forn.id, pedidoMinimo:"500,00" })) && s.ce.fornecedores.find((f) => f.id===forn.id).pedidoMinimo===500);
t("valor mínimo zero é recusado", !passou(run("forn_condicoes", { id:forn.id, pedidoMinimo:0 })));
t("histórico: valor mínimo do pedido", s.ce.logPrecos.some((l) => l.fornecedorId===forn.id && l.campo==="Valor mínimo do pedido" && l.depois==="R$ 500,00"));
t("fornecedor com produtos não pode ser excluído", !passou(run("forn_del", { id:forn.id })));
s.ce.pedidos.push({ id:99999, status:"NAO_VERIFICADA", itens:[{ id:1, precoProdutoId:pf.id, precoOpcaoId:of[0].id }] });   // simula a etapa 3: produto usado em compra
t("produto usado em compra não se exclui", !passou(run("preco_del", { id:pf.id })));
t("opção usada em compra não se remove", !passou(run("preco_salvar", Object.assign({}, pf, { opcoes:pf.opcoes.filter((o) => o.id!==of[0].id) }))));
s.ce.pedidos = s.ce.pedidos.filter((p) => p.id!==99999);
t("produto sem uso se exclui", passou(run("preco_del", { id:pf.id })) && !s.ce.precos.some((p) => p.id===pf.id));
t("material e foto ficam vazios (etapa 2)", prod().materialId===null && prod().foto===null);

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
