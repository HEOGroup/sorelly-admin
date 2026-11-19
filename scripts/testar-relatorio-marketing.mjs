// Teste do Marketing › Relatório diário: regras (domain/relatorio-marketing.js) e desenho da tela no servidor. Uso: node scripts/testar-relatorio-marketing.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { mrMigrar, mrReduz, mrTexto } = await jiti.import("@/apps/montagem/domain/relatorio-marketing");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };

// regras
let s = { mr: undefined };
const aplica = (a) => { const r = mrReduz(s, a); if(r.patch && r.patch.mr) s = Object.assign({}, s, r.patch); return r; };
let m = mrMigrar(s.mr);
t("começa com 4 atividades", m.atividades.length===4 && Object.keys(m.dias).length===0);
const a1 = m.atividades[0].id, a2 = m.atividades[1].id;
let r = aplica({op:"dia_set", data:"2026-11-17", q:{[a1]:"5", [a2]:"12", xx:"9"}, obs:"  Dia cheio  ", por:"Beatriz"});
t("salva o dia com os números e a observação", r.msg==="Relatório do dia salvo" && s.mr.dias["2026-11-17"].q[a1]===5 && s.mr.dias["2026-11-17"].q[a2]===12 && s.mr.dias["2026-11-17"].obs==="Dia cheio" && s.mr.dias["2026-11-17"].por==="Beatriz");
t("ignora atividade que não existe e número ruim", !("xx" in s.mr.dias["2026-11-17"].q) && mrReduz(s, {op:"dia_set", data:"17/11/2026", q:{}}).msg==="Escolha a data.");
r = aplica({op:"dia_set", data:"2026-11-17", q:{[a1]:"-3", [a2]:"abc"}, por:"Marcus"});
t("número negativo ou texto vira zero e some", Object.keys(s.mr.dias["2026-11-17"].q).length===0 && s.mr.dias["2026-11-17"].criadoPor==="Beatriz");
aplica({op:"dia_set", data:"2026-11-17", q:{[a1]:"7"}, obs:"Final", por:"Beatriz"});
r = aplica({op:"ativ_set", nome:"Artes do dia"});
t("recusa atividade com nome repetido", r.msg==="Já existe uma atividade com esse nome.");
r = aplica({op:"ativ_set", nome:"Carrossel"});
t("cria atividade nova", s.mr.atividades.length===5 && r.msg==="Atividade criada");
const idNova = s.mr.atividades[4].id;
aplica({op:"ativ_set", id:idNova, nome:"Carrosséis"});
t("renomeia atividade", s.mr.atividades[4].nome==="Carrosséis");
aplica({op:"ativ_del", id:idNova});
t("tira atividade da lista", s.mr.atividades.length===4);
const txt = mrTexto(s.mr, "2026-11-17");
t("texto para copiar tem data, atividades, total e observação", /17\/11\/2026/.test(txt) && /Artes do dia: \*7\*/.test(txt) && /Total: 7/.test(txt) && /Final/.test(txt));
r = aplica({op:"dia_del", data:"2026-11-17"});
t("apaga o dia", !s.mr.dias["2026-11-17"] && mrReduz(s, {op:"dia_del", data:"2026-11-17"}).msg==="Esse dia não tem relatório.");
t("sempre sobra pelo menos uma atividade", (() => { let x = { mr:{ atividades:[{id:"z", nome:"Única"}], dias:{} } }; return mrReduz(x, {op:"ativ_del", id:"z"}).msg==="Precisa ficar pelo menos uma atividade."; })());

// tela
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const { AbaRelatorioMarketing } = await jiti.import("@/apps/montagem/pages/RelatorioMarketing");
const html = (st) => renderToString(React.createElement(Ctx.Provider, {value:{state:st, dispatch(){}}}, React.createElement(AbaRelatorioMarketing)));
let h = "";
try { h = html({usuario:16}); t("desenha a tela sem erro", h.length>1000); } catch(x){ t("desenha a tela sem erro", false, String(x && x.stack || x).slice(0, 400)); }
t("título, botões e colunas", /Relatório diário do Marketing/.test(h) && />Atividades</.test(h) && />Preencher hoje</.test(h) && ["Data", "Dia da semana", "Artes do dia", "Stories", "Total", "Preenchido por", "Observação"].every(n => h.includes(n)));
t("sem bloco Filtros nem busca no topo", !/Filtros/.test(h) && !/Buscar/.test(h));
console.log("\n"+ok+" verificações OK, "+falha+" com falha.");
process.exit(falha ? 1 : 0);
