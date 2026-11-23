// Teste de fumaça de RH › Acessos e autorizações (refeita em 19/11/2026): a visão Pessoas é uma tabela só, uma linha por pessoa, sem blocos de totais nem busca no topo.
// Uso: node scripts/testar-tela-acessos.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const T = await jiti.import("@/apps/montagem/pages/AcessosAutorizacoes");
const P = await jiti.import("@/apps/montagem/pages/AcessosPessoas");
const { rhDemo } = await jiti.import("@/apps/montagem/domain/rh");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const desenha = (Comp, usuario = 16) => renderToString(React.createElement(Ctx.Provider, { value:{ state:{ usuario, rh:rhDemo(), acessos:{}, autoriz:{} }, dispatch(){} } }, React.createElement(Comp)));
let h = "";
try { h = desenha(T.AbaAcessosAutorizacoes); t("a tela desenha sem erro", h.length>800); } catch(x){ t("a tela desenha sem erro", false, String(x && x.stack || x).slice(0, 400)); }
t("título e menu suspenso de visões", /Acessos e autorizações/.test(h) && ["Pessoas", "Telas por grupo", "Autorizações por tipo", "Avisos"].every((n) => h.includes(">"+n+"<")));
t("uma tabela com poucas colunas: Pessoa, Acesso, Setor, Situação e Ação", ["Pessoa", "Acesso", "Setor", "Situação", "Ação"].every((n) => h.includes(n)));
t("lista a equipe: Priscila, Amanda de Miranda e Marcus", ["Priscila", "Amanda de Miranda", "Marcus"].every((n) => h.includes(n)));
t("Priscila e Amanda aparecem com Acesso total", h.split("Acesso total").length - 1 >= 2);
t("sem busca no topo, sem blocos de totais, sem botões de abas lado a lado e sem detalhe de três colunas", !/Buscar pessoa/.test(h) && !/Quem pode fazer o quê/.test(h) && !/aria-pressed/.test(h) && !/Telas que abre/.test(h));
t("a coluna Setor é um menu com os setores (Diretoria, Financeiro, Inadimplência...)", ["Diretoria", "Financeiro", "Inadimplência", "Secretaria"].every((n) => h.includes(">"+n+"<")));
let hp = "";
try { hp = desenha(P.AbaAcessosPessoas, 31); t("quem só vê (Marco Antonio) recebe o aviso e a tabela", /Você está só vendo/.test(hp) && hp.includes("Pessoa")); } catch(x){ t("visão Pessoas desenha", false, String(x && x.stack || x).slice(0, 300)); }
console.log("\n"+ok+" verificações OK, "+falha+" com falha."); process.exit(falha ? 1 : 0);
