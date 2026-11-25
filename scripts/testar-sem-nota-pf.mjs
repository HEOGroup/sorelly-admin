// Teste da opção "Sem nota" da janela Lançar pedido e enviar proposta (Pagamentos a fornecedores › Negociações, 25/11/2026).
// Roda as regras de verdade (domain/pf.js) e as funções da janela (mensagem e reabertura), na memória. Nada vai para o banco.
// Uso: node scripts/testar-sem-nota-pf.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const P = await jiti.import("@/apps/montagem/domain/pf");
const N = await jiti.import("@/apps/montagem/pages/pf/Negociacoes");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const pf0 = P.pfVazio();
pf0.fornecedores = [{ id:5, nome:"Fornecedor Teste", tipo:"fornecedor", cat:"Fornecedor de peças", cnpj:"", formas:Object.keys(P.FORMAS), ciclo:{ periodicidade:"mensal", cortes:[31], prazoDias:0 } }];
pf0.seq = { L:1, F:6, P:1, Pg:1, mqP:1, mqB:1 };
let s = { pf:pf0, usuario:16 };
const run = (op, d) => { const r = P.pfReduz(s, Object.assign({ type:"PF", op, por:"Teste", semLimite:true }, d)); if(r.patch && r.patch.pf) s = { pf:r.patch.pf, usuario:16 }; return r; };
const passou = (r) => !!(r.patch && r.patch.pf);
const ult = () => s.pf.pedidos[s.pf.pedidos.length-1];
const pix = (v, venc) => ({ forma:"pix_revendedora", venc, valor:v, qtd:"1", conta:"", status:"Pendente" });

console.log("1. Gravar \"Sem nota\"");
t("Sem nota com valor com nota é recusado", !passou(run("pedido_add", { fornId:5, numero:"A1", data:"2026-11-25", total:1000, nfTipo:"misto", comNF:300, semNF:700, cnpj:"Sem NF", semNota:true, linhas:[pix(700, "2026-12-10")], forcar:true })));
let r = run("pedido_add", { fornId:5, numero:"A1", data:"2026-11-25", total:1000, nfTipo:"sem", comNF:0, semNF:1000, cnpj:"Sem NF", nfNum:"", semNota:true, nfArq:{ key:"an_x", nome:"nota.pdf" }, linhas:[pix(500, "2026-12-10"), pix(500, "2027-01-10")] });
const A = ult();
t("lançado com a marca semNota, 0 com nota e 100% sem nota", passou(r) && A.semNota===true && A.comNF===0 && A.semNF===1000, r.msg);
t("sem CNPJ inventado (texto continua \"Sem NF\") e sem arquivo de nota no pedido", A.cnpj==="Sem NF" && A.nfNum==="" && A.nfArq===null);
t("só parcelas sem nota (Pix)", A.parcelas.every((p) => p.forma==="pix_revendedora"));

console.log("2. Reabrir e editar");
const ed = N.pedidoParaEdicao(A);
t("reabre com \"Sem nota\" selecionado e os valores certos", ed.cnpj===N.SEM_NOTA && Number(ed.com)===0 && Number(ed.sem)===1000);
const antigo = Object.assign({}, A); delete antigo.semNota;
t("pedido antigo 100% sem nota (\"Sem NF\") também reabre com \"Sem nota\"", N.pedidoParaEdicao(antigo).cnpj===N.SEM_NOTA);
const comCnpj = { id:99, fornId:5, numero:"B", data:"2026-11-25", total:1000, nfTipo:"misto", comNF:300, semNF:700, cnpj:"CNPJ 46 · Sorelly Comércio", nfNum:"123", parcelas:[] };
t("pedido com CNPJ continua com o CNPJ", N.pedidoParaEdicao(comCnpj).cnpj==="CNPJ 46 · Sorelly Comércio");
r = run("pedido_editar", { id:A.id, fornId:5, numero:"A1", data:"2026-11-25", total:1000, nfTipo:"misto", comNF:400, semNF:600, cnpj:"CNPJ 46 · Sorelly Comércio", nfNum:"777", semNota:false, linhas:[{ forma:"boleto", venc:"2026-12-20", valor:400, qtd:"1", conta:"", status:"Pendente" }, pix(600, "2026-12-10")], forcar:true });
t("editar para um CNPJ tira a marca e volta a ter nota", passou(r) && !ult().semNota && ult().comNF===400 && ult().cnpj==="CNPJ 46 · Sorelly Comércio" && ult().nfNum==="777", r.msg);
r = run("pedido_editar", { id:A.id, fornId:5, numero:"A1", data:"2026-11-25", total:1000, nfTipo:"sem", comNF:0, semNF:1000, cnpj:"Sem NF", nfNum:"", semNota:true, linhas:[pix(1000, "2026-12-10")], forcar:true });
t("editar de volta para Sem nota", passou(r) && ult().semNota===true && ult().comNF===0 && ult().nfNum==="", r.msg);

console.log("3. Mensagem (Copiar proposta / Enviar e lançar)");
const pedSem = { fornId:5, cnpj:N.SEM_NOTA, nfNum:"11881", numero:"A1", data:"2026-11-25", lcom:[], lsem:[pix("500.00", "2026-12-10"), pix("500.00", "2027-01-10")] };
const m1 = N.msgProposta(s.pf, pedSem, { total:1000, com:0, sem:1000 });
t("mostra \"Modalidade: Sem nota\"", /🏢 Modalidade: Sem nota/.test(m1));
t("não mostra CNPJ nem a NF antiga", !/Pagador/.test(m1) && !/CNPJ/.test(m1) && !/NF 11881/.test(m1));
t("valores: total R$ 1.000,00 todo em Pix", /VALOR TOTAL: R\$\s?1\.000,00/.test(m1) && /PIX \(100%\)/.test(m1));
const m2 = N.msgProposta(s.pf, Object.assign({}, pedSem, { cnpj:"CNPJ 46 · Sorelly Comércio" }), { total:1000, com:0, sem:1000 });
t("com CNPJ a mensagem continua como antes (Pagador)", /🏢 Pagador: CNPJ/.test(m2));

console.log("\n"+ok+" OK, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
