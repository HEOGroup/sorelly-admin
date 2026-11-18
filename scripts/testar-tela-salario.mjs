// Teste de fumaça da visão Salário e bônus: desenha as janelas no servidor (sem navegador) e confere o básico. Uso: node scripts/testar-tela-salario.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const sv = await jiti.import("@/apps/montagem/pages/rh/SalarioVisao");
const rhm = await jiti.import("@/apps/montagem/domain/rh");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const rh = rhm.rhDemo(), c = { s:{ usuario:16, rh }, rh, d(){}, por:"Teste", veSalario:true }, esc = { ano:2026, mes:11 };
const rem = sv.salDados(c, esc, "rem"), pag = sv.salDados(c, esc, "pag");
t("remuneração: colunas e linhas", rem.cols.length===10 && rem.linhas.length>0);
t("pagamentos: datas do mês (dia 20 e 5º dia útil)", pag.datas.adiant==="2026-11-20" && /^2026-11-0\d$/.test(pag.datas.salario), JSON.stringify(pag.datas));
t("sábado conta: 5º dia útil de outubro/2026 é 06/10", sv.salDados(c, {ano:2026, mes:10}, "pag").datas.salario==="2026-10-06");
t("pagamentos: sem coluna 'a pagar'", pag.cols.every((x) => !/a pagar/i.test(x.t)));
const id = rem.linhas[0].id, h = (el) => renderToString(React.createElement(el));
try { const html = renderToString(React.createElement(sv.SalJanelas, { c, esc, pessoa:id, fecharPessoa(){} })); t("card desenha com os dois pagamentos", /Adiantamento \(dia 20\)/.test(html) && /Salário \(5º dia útil\)/.test(html) && /Meses lançados/.test(html)); } catch(x){ t("card desenha", false, String(x && x.stack || x).slice(0, 300)); }
try { const html = renderToString(React.createElement(sv.SalImportar, { c, esc, fechar(){} })); t("janela Puxar do Financeiro desenha", /Puxar do Financeiro/.test(html)); } catch(x){ t("janela Puxar do Financeiro desenha", false, String(x && x.stack || x).slice(0, 300)); }
const plano = sv.planoDoMes(c, esc, [["46","3.01.01.02","SALÁRIO","","1","1","1", rh && c.s ? "x" : "", "2026-11-06","2026-11-06",1000]]);
t("plano ignora pagamento sem pessoa correspondente", plano.pessoas.length===0 && plano.sem.length===1);
const idA = rem.linhas[0].id, idB = rem.linhas[1].id;
const r1 = rhm.rhReduz({ rh }, { type:"RH", op:"pag_lote", por:"Teste", itens:[{ mes:"2026-11", id:idA, patch:{ salValor:1000, salData:"2026-11-06", bonus:50 } }, { mes:"2026-10", id:idB, patch:{ advValor:300, advData:"2026-10-20", beneficios:20 } }, { mes:"novembro", id:idA, patch:{ bonus:1 } }] });
t("pag_lote grava vários meses de uma vez e ignora mês inválido", r1.patch.rh && r1.patch.rh.pagamentos["2026-11"][idA].salValor===1000 && r1.patch.rh.pagamentos["2026-11"][idA].salData==="2026-11-06" && r1.patch.rh.pagamentos["2026-10"][idB].advValor===300 && !r1.patch.rh.pagamentos.novembro && /2 lançamentos/.test(r1.msg), JSON.stringify(r1.msg));
t("pag_lote sem itens recusa", !rhm.rhReduz({ rh }, { type:"RH", op:"pag_lote", itens:[] }).patch.rh);
console.log("\n"+ok+" verificações OK, "+falha+" com falha."); process.exit(falha ? 1 : 0);
