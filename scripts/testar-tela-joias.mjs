// Teste de fumaça da tela RH › Pagamento em joias: desenha a tela no servidor (sem navegador) e confere se os pagamentos e botões aparecem. Uso: node scripts/testar-tela-joias.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const { AbaPagamentoJoias } = await jiti.import("@/apps/montagem/pages/PagamentoJoias");

let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const item = (id, pessoa, sit, extra) => Object.assign({id, pessoa, setor:"Marketing", motivo:"Modelo para fotos", descricao:"", valor:500, custoPct:20, pecas:"A2357", situacao:sit, criadoEm:"2026-11-17T09:00:00", mes:"2026-11", autorizadoPor:"Marcus", historico:[]}, extra || {});
const estado = {usuario:16, jp:{v:1, itens:[item("a", "Ana Paula", "Autorizado"), item("b", "Beatriz", "Pedido"), item("c", "Carla", "Separado"), item("d", "Dora", "Retirado", {recebeu:"Dora", retiradoEm:"2026-11-17T10:00:00"}), item("e", "Eva", "Cancelado")]}};
const html = (s) => renderToString(React.createElement(Ctx.Provider, {value:{state:s, dispatch(){}}}, React.createElement(AbaPagamentoJoias)));
let h = "";
try { h = html(estado); t("desenha a tela sem erro", h.length>1000); } catch(x){ t("desenha a tela sem erro", false, String(x && x.stack || x).slice(0, 400)); }
t("mostra o título e o botão Novo pagamento", /Pagamento em joias/.test(h) && /Novo pagamento/.test(h));
t("mostra as pessoas dos pagamentos", ["Ana Paula", "Beatriz", "Carla", "Dora", "Eva"].every(n => h.includes(n)));
t("mostra o valor e o custo", /R\$\s*500,00/.test(h) && /R\$\s*100,00/.test(h));
t("botões de cada situação (Separado, Retirado, Autorizar, Copiar recibo, Cancelar, Apagar)", ["Separado", "Retirado", "Autorizar", "Copiar recibo", "Cancelar", "Apagar"].every(n => h.includes(">"+n+"<")));
t("diretoria (16) vê Autorizar; quem não tem a autorização vê só 'Aguarda a diretoria'", !html(Object.assign({}, estado, {usuario:99})).includes(">Autorizar<") && html(Object.assign({}, estado, {usuario:99})).includes("Aguarda a diretoria"));
t("estado vazio não quebra", html({usuario:16}).includes("Nenhum pagamento em joias registrado"));
console.log("\n"+ok+" verificações OK, "+falha+" com falha.");
process.exit(falha ? 1 : 0);
