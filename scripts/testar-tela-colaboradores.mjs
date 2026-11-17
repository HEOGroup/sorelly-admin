// Teste de fumaça da tela RH › Cadastro de colaboradores: desenha no servidor e confere o padrão (topo, tabela com filtro na coluna). Uso: node scripts/testar-tela-colaboradores.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const { AbaRhColab } = await jiti.import("@/apps/montagem/pages/RH");
const { rhDemo } = await jiti.import("@/apps/montagem/domain/rh");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let h = "";
try { h = renderToString(React.createElement(Ctx.Provider, {value:{state:{usuario:16, rh:rhDemo()}, dispatch(){}}}, React.createElement(AbaRhColab))); t("desenha a tela sem erro", h.length>1000); } catch(x){ t("desenha a tela sem erro", false, String(x && x.stack || x).slice(0, 400)); }
t("título e botão no topo", /Cadastro de colaboradores/.test(h) && /Nova colaboradora/.test(h));
t("visões Ativos, Desligados e Todos", ["Ativos", "Desligados", "Todos"].every(n => h.includes(">"+n+"<")));
t("colunas da tabela", ["Nome", "Setor", "Função", "Empresa", "Situação", "Admissão", "Escala", "Entrada", "Salário"].every(n => h.includes(n)));
t("sem bloco Filtros nem busca no topo", !/Filtros/.test(h) && !/Buscar nome ou setor/.test(h));
console.log("\n"+ok+" verificações OK, "+falha+" com falha.");
process.exit(falha ? 1 : 0);
