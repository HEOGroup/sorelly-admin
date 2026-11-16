// Teste do fluxo da Deysiane SEM a Calculadora, com os kits REAIS do banco (só leitura). Uso: node --env-file-if-exists=.env.local scripts/testar-fluxo-deysiane.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" }, matchMedia(){ return {matches:false, addEventListener(){}, removeEventListener(){}}; } };
globalThis.document = globalThis.document || { addEventListener(){}, removeEventListener(){}, querySelector(){ return null; }, body:{} };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo } = await jiti.import("@/apps/montagem/state/store");
const { SUPERVISORA } = await jiti.import("@/apps/montagem/domain/equipe");
const { consulta, pool } = await import("./../src/server/db.js");
const { React } = await jiti.import("@/shared/react");
const { renderToStaticMarkup } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const { AbaPainel } = await jiti.import("@/apps/montagem/pages/Painel");
let ok = 0, falha = 0; const t = (n, c, x) => { if (c) { ok++; console.log("  OK   " + n); } else { falha++; console.log("  FALHA " + n + (x ? " -> " + x : "")); } };
const c = (await consulta("select conteudo from sorelly.estado_modulo where modulo='lst'")).rows[0].conteudo;
let s = novo(); s.listagens = c.listagens; s.kits = JSON.parse(JSON.stringify(c.kits)); s.logado = true; s.usuario = SUPERVISORA.id;
const K = (nome, lid) => s.kits.find(k => k.rev.startsWith(nome) && (!lid || k.lid === lid));
const kit = (st, nome) => st.kits.find(k => k.rev.startsWith(nome));

console.log("1) Kits do piloto como estão no servidor (valor automático já aplicado)");
const comValor = s.kits.filter(k => k.defAuto).length, semValor = s.kits.filter(k => k.tipoKit === "acerto_kit" && k.valor == null && ["semvalor", "precond"].includes(k.status) && s.listagens.some(l => l.id === k.lid && l.data >= new Date(Date.now()-3*3600000).toISOString().slice(0,10))).length;
t("kits com valor automático: " + comValor, comValor >= 14);
t("kits sem valor (ficam para a Deysiane): " + semValor, semValor === 4, String(semValor));

console.log("2) Flavia Alves (hoje, média acima de R$ 2.500, sem valor): a Deysiane define clicando");
let r = reducer(s, { type: "DEFINIR_VALOR", id: K("Flavia").id, valor: 9000 }); let k = kit(r, "Flavia");
t("valor vira R$ 9.000 e o kit vai para pendente (montagem)", k.valor === 9000 && k.status === "pendente", k.status + " / " + k.valor);
t("marcado como manual e por quem definiu", k.manual === true && k.defPor === SUPERVISORA.id);

console.log("3) Ana Caroline (17/11, sem valor, ainda esperando a Marjory)");
r = reducer(s, { type: "DEFINIR_VALOR", id: K("Ana Caroline").id, valor: 11000 }); k = kit(r, "Ana Caroline");
t("antes da Marjory liberar, o valor NÃO muda (mensagem 'só antes da montagem')", k.valor == null && k.status === "precond", k.status + " / " + k.valor);
const kk = K("Ana Caroline"); let r2 = s; (kk.cond.nums || []).forEach(n => { r2 = reducer(r2, { type: "COND_CHK_PRE", id: kk.id, num: n, v: true }); });
r2 = reducer(r2, { type: "LIBERAR_COND", ids: [kk.id], por: 24 }); k = kit(r2, "Ana Caroline");
t("a Marjory libera: kit vai para sem valor (aparece em vermelho para a Deysiane)", k.status === "semvalor" && k.valor == null, k.status + " / " + k.valor);
r2 = reducer(r2, { type: "DEFINIR_VALOR", id: kk.id, valor: 11000 }); k = kit(r2, "Ana Caroline");
t("a Deysiane digita R$ 11.000: kit pendente", k.valor === 11000 && k.status === "pendente", k.status + " / " + k.valor);

console.log("4) Tatiana Huberto (17/11, valor automático R$ 10.000): a Marjory libera e a Deysiane muda o valor");
const tt = K("Tatiana"); let r3 = reducer(s, { type: "COND_CHK_PRE", id: tt.id, num: tt.cond.nums[0], v: true }); r3 = reducer(r3, { type: "LIBERAR_COND", ids: [tt.id], por: 24 }); k = kit(r3, "Tatiana");
t("liberada com o valor automático mantido, direto em pendente", k.valor === 10000 && k.status === "pendente" && k.defAuto === true, k.status + " / " + k.valor);
r3 = reducer(r3, { type: "DEFINIR_VALOR", id: tt.id, valor: 11000 }); k = kit(r3, "Tatiana");
t("a Deysiane muda para R$ 11.000: continua pendente e fica como manual", k.valor === 11000 && k.manual === true && k.status === "pendente", k.status + " / " + k.valor + " / manual " + k.manual);

console.log("5) Usar sugerido (menu ⋯) em kit sem valor");
const { sugerido } = await jiti.import("@/apps/montagem/domain/vendas");
const fl = K("Flavia"); const sug = sugerido(fl.vendas, s.cfg);
r = reducer(s, { type: "DEFINIR_VALOR", id: fl.id, valor: sug }); t("sugerido da tabela (" + sug + ") entra como valor", kit(r, "Flavia").valor === sug && kit(r, "Flavia").manual === false);

console.log("6) A Listagem que a Deysiane vê (desenhada como supervisora)");
const mudos = (fn) => { const o = console.error; console.error = () => {}; try { return fn(); } finally { console.error = o; } };
s.aba = "painel"; s.abertas = {}; s.listagens.forEach(l => { s.abertas[l.id] = true; });   // abre todas as listagens para ver as linhas
const H = mudos(() => renderToStaticMarkup(React.createElement(Ctx.Provider, { value: { state: s, dispatch() {} } }, React.createElement(AbaPainel))));
t("a tela desenha sem erro (" + H.length + " caracteres)", H.length > 2000);
t("NÃO existe mais o botão 'Definir' que abria a calculadora", !H.includes(">Definir<") && !H.includes("Ir para a Calculadora"));
t("kit sem valor mostra o valor clicável (título 'Sem valor definido, clique para definir')", H.includes("Sem valor definido, clique para definir"), "");
t("kit com valor automático mostra 'Clique para alterar'", H.includes("Clique para alterar"));
console.log("\n" + ok + " certas, " + falha + " falhas");
await pool().end();
process.exit(falha ? 1 : 0);
