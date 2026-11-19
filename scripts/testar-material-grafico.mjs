// Teste do setor Material gráfico (17/11/2026): funil de orçamentos (criar, rodadas, fechar, virar pedido), mensagem para o chat e filtro das categorias gráficas.
// Roda as regras de verdade, sem navegador e sem banco. Uso: node scripts/testar-material-grafico.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const D = await jiti.import("@/apps/montagem/domain/compras-estoque");
const G = await jiti.import("@/apps/montagem/domain/material-grafico");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let s = { ce: D.ceDemo() };
const run = (op, dados) => { const r = D.ceReduz(s, Object.assign({ type:"CE", op, por:"Teste", porId:29, podeAutorizar:true }, dados)); if(r.patch && r.patch.ce) s = Object.assign({}, s, r.patch); return r; };
const passou = (r) => !!(r.patch && r.patch.ce);

t("estado novo tem a lista de orçamentos", Array.isArray(s.ce.orcamentos) && s.ce.orcamentos.length===0);
t("recusa orçamento sem tipo", !passou(run("orc_add", { modeloId:"xx", quantidade:10 })));
t("recusa quantidade zero", !passou(run("orc_add", { modeloId:"tag", quantidade:0 })));
const r1 = run("orc_add", { modeloId:"tag", campos:{ linha:"Choker", cor:"Verde escuro" }, quantidade:"5.000".replace(".", ""), prazoDesejado:"até 20/12" });
t("cria orçamento", passou(r1) && s.ce.orcamentos.length===1 && s.ce.orcamentos[0].etapa==="ORCAMENTO");
const id = s.ce.orcamentos[0].id;
const msg = G.mensagemOrcamento(s.ce.orcamentos[0], "Office Graff");
t("mensagem tem tipo, quantidade e prazo", /Tag — Choker · Verde escuro/.test(msg) && /5\.000 unidades/.test(msg) && /até 20\/12/.test(msg));
t("não fecha sem rodada", !passou(run("orc_fechar", { id })));
t("recusa rodada sem valor", !passou(run("orc_rodada", { id, valorUnit:"" })));
t("registra rodada e vai para Negociando", passou(run("orc_rodada", { id, valorUnit:"0,25", prazoDias:"25", quem:"Edson" })) && s.ce.orcamentos[0].etapa==="NEGOCIANDO");
t("segunda rodada", passou(run("orc_rodada", { id, valorUnit:"0,23", prazoDias:"20" })) && s.ce.orcamentos[0].rodadas.length===2);
t("não cria pedido antes de fechar", !passou(run("orc_pedido", { id })));
t("fecha com a última rodada", passou(run("orc_fechar", { id })) && s.ce.orcamentos[0].final.valorUnit===0.23 && s.ce.orcamentos[0].final.total===1150);
const antes = s.ce.pedidos.length;
const rp = run("orc_pedido", { id });
t("cria o pedido em Compras", passou(rp) && s.ce.pedidos.length===antes+1, rp.msg);
const o = s.ce.orcamentos[0], p = s.ce.pedidos[s.ce.pedidos.length-1];
t("orçamento fica ligado ao pedido", o.etapa==="PEDIDO" && o.pedidoId===p.id);
t("pedido leva valor, quantidade e a origem", p.itens[0].quantidade===5000 && Number(p.itens[0].valorUnitario)===0.23 && /Material gráfico/.test(p.observacao));
t("não cancela o que já virou pedido", !passou(run("orc_cancelar", { id })));
const r2 = run("orc_add", { modeloId:"adesivo", campos:{ tipo:"MEGA PROMO" }, quantidade:100 });
const id2 = s.ce.orcamentos[1].id;
t("cancela e reabre", passou(run("orc_cancelar", { id:id2 })) && s.ce.orcamentos[1].etapa==="CANCELADO" && passou(run("orc_reabrir", { id:id2 })) && s.ce.orcamentos[1].etapa==="ORCAMENTO");
t("categorias gráficas", ["Tag Coração", "Adesivos e cordinhas", "Cartão garantia", "Embalagens", "Etiquetas", "Kit apoio", "Maletas"].every(G.ehCategoriaGrafica) && !G.ehCategoriaGrafica("Limpeza") && !G.ehCategoriaGrafica("Escritório"));
t("modelos: todos têm campos e nome", G.MODELOS.every((m) => m.nome && m.campos.length>0));
console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
