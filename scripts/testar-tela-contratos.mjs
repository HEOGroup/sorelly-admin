// Teste de fumaça das telas RH › Contratos (refeitas em 19/11/2026): desenha cada tela no servidor e confere o padrão (tabela com filtro na coluna, sem blocos de totais, sem busca no topo).
// Uso: node scripts/testar-tela-contratos.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const T = await jiti.import("@/apps/montagem/pages/RHContratos");
const { rhDemo, rhReduz } = await jiti.import("@/apps/montagem/domain/rh");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let rh = rhDemo();
// um contrato de cada tipo para a tabela ter linhas
const mais = (tipo, nome, patch) => { const r = rhReduz({ rh }, { type:"RH", op:"contr_add", por:"Teste", tipo, nome }); rh = r.patch && r.patch.rh ? r.patch.rh : rh; const ct = rh.contratos.find((x) => x.nome===nome && x.tipo===tipo); if(ct && patch) Object.assign(ct, patch); };
mais("TERCEIRO", "Escritório Advocacia Teste", { valor:3000, extra:{ tipo:"Advogado", registro:"OAB 12345" }, status:"ativo" });
mais("PARTICULAR", "Prestador Particular Teste", { valor:500 });
mais("CREDITO", "Banco Teste capital de giro", { valor:50000, extra:{ saldo:30000, parcela:2000 } });
mais("ALUGUEL", "Sala 1401 Teste", { valor:4000, status:"ativo" });
mais("CONSORCIO", "Ademicon Teste", { valor:100000, extra:{ saldo:80000 } });
mais("REPRESENTANTE", "Representante Teste", {});
mais("CLT", "Funcionária Teste", { valor:2500 });
const desenha = (Comp) => renderToString(React.createElement(Ctx.Provider, { value:{ state:{ usuario:16, rh }, dispatch(){} } }, React.createElement(Comp)));
const telas = [["Representantes", T.AbaRhContrRep, "Contratos de representantes", ["Representante", "Status", "Testemunha 1", "Termo de equipamento"]], ["Funcionários (CLT)", T.AbaRhContrFunc, "Contratos de funcionários (CLT)", ["Nome", "Cargo", "Empresa", "Salário", "Aditivos"]],
  ["Terceiros", T.AbaRhContrTerc, "Contratos de terceiros", ["Nome", "Tipo", "Registro (OAB, CRC...)", "Honorário mensal", "Vigência (fim)"]], ["Particulares do Marcus", T.AbaRhContrMarcus, "Contratos particulares do Marcus", ["Nome", "Tipo", "Honorário mensal"]],
  ["Crédito bancário", T.AbaRhContrCredito, "Crédito bancário", ["Banco", "Saldo devedor", "Pronampe", "Gerentes dos bancos"]], ["Aluguéis", T.AbaRhContrAluguel, "Aluguéis", ["Imóvel", "Locador", "Valor mensal"]],
  ["Consórcios", T.AbaRhContrConsorcio, "Consórcios", ["Consórcio", "Cota", "Valor da carta", "Saldo a pagar"]], ["Modelos", T.AbaRhContrModelos, "Modelos de contrato", ["Modelo", "Tipo de contrato", "Variáveis"]]];
for(const [nome, Comp, titulo, colunas] of telas){
  let h = "";
  try { h = desenha(Comp); t(nome+": desenha sem erro", h.length>500); } catch(x){ t(nome+": desenha sem erro", false, String(x && x.stack || x).slice(0, 300)); continue; }
  t(nome+": título e colunas", h.includes(titulo) && colunas.every((c) => h.includes(c)), colunas.filter((c) => !h.includes(c)).join(", "));
  t(nome+": sem busca no topo, sem blocos de totais e sem chips", !/Buscar…/.test(h) && !/Todos os status/.test(h) && !/Vencendo \(/.test(h));
}
const hTerc = desenha(T.AbaRhContrTerc);
t("Terceiros: tipo de prestador em menu suspenso (Advogado, Contador...)", ["Advogado", "Contador", "Segurança do trabalho"].every((n) => hTerc.includes(">"+n+"<")));
t("Terceiros: mostra o terceiro cadastrado", hTerc.includes("Escritório Advocacia Teste"));
const hAlu = desenha(T.AbaRhContrAluguel);
t("Aluguéis: total no fim da tabela com R$", /Total/.test(hAlu) && /R\$\s?4\.000,00/.test(hAlu));
console.log("\n"+ok+" verificações OK, "+falha+" com falha."); process.exit(falha ? 1 : 0);
