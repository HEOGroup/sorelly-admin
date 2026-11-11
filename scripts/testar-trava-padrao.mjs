// Teste da trava do padrão visual para TABELA e FILTRO (11/11/2026). Roda as regras de verdade (scripts/padrao-regras.mjs), sem navegador e sem servidor.
// Uso: node scripts/testar-trava-padrao.mjs   (saída 1 = alguma verificação falhou)
// Casos que DEVEM reprovar (filtro no topo, filtro feito à mão, tabela sem filtro na coluna, tabela dourada) e casos que DEVEM passar (a peça certa).
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const raiz = process.argv[2] || process.cwd();
const R = await import(pathToFileURL(path.join(raiz, "scripts/padrao-regras.mjs")).href);
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if (cond) { ok++; console.log("  OK   " + nome); } else { falha++; console.log("  FALHA " + nome + (extra ? " -> " + extra : "")); } };
const PAG = "src/apps/montagem/pages/Teste.js", COMP = "src/apps/montagem/components/teste.js";
const reprova = (nome, linha, arquivo, esperaTexto) => { const e = R.conferirLinhas(arquivo || PAG, [linha], {}); t("REPROVA: " + nome, e.length > 0 && (!esperaTexto || e.join(" ").indexOf(esperaTexto) >= 0), JSON.stringify(e)); };
const passa = (nome, linha, arquivo) => { const e = R.conferirLinhas(arquivo || PAG, [linha], {}); t("PASSA:   " + nome, e.length === 0, JSON.stringify(e)); };

console.log("— filtro no topo");
reprova("e(BlocoFiltros", '    e(BlocoFiltros, {a:1}, e(CampoSel, null)),', null, "filtros no topo");
reprova("e(BarraFiltros", '    e(BarraFiltros,{ativo:true, onLimpar:function(){}}, x),', null, "filtros no topo");
reprova("import de BarraFiltros", 'import { BarraFiltros, Pagina } from "@/apps/montagem/components/padrao";', null, "filtros no topo");
reprova("<BarraFiltros", "  <BarraFiltros ativo />", null, "filtros no topo");
reprova('bloco com título "Filtros" feito à mão', '    e(BlocoBarra,{t:"Filtros", cor:"azul", compacto:true}, grade),', null, "feito à mão");
reprova("e(CampoBusca no topo", '    e(CampoBusca,{value:q, onChange:setQ}),', null, "feito à mão");
reprova('botão "Filtrar" no topo', '    e(Botao,{onClick:filtrar, className:"h-8"}, "Filtrar"),', null, "feito à mão");

console.log("— tabela sem filtro na coluna");
reprova("e(TabelaCampos", '      e(TabelaCampos,{cols:COLS, minW:"60rem"}, linhas),', null, "TabelaPlanilha");
reprova("e(FileiraCampos", '        e(FileiraCampos,{key:1, cells:["a", "b"]}),', null, "TabelaPlanilha");
reprova("import de TabelaCampos", 'import { FileiraCampos, TabelaCampos } from "@/apps/montagem/components/padrao-fin";', null, "TabelaPlanilha");
reprova("e(TabelaP", '    e(TabelaP,{cols:["A"]}, x),', null, "TabelaPlanilha");
reprova("e(Tab, (peça antiga)", '    e(Tab,{cols:["A", "B"]}, linhas),', null, "TabelaPlanilha");
reprova('<table> à mão', '    e("table",{className:"w-full"}, e("thead", null)),', null, "TabelaPlanilha");

console.log("— tabela dourada");
reprova("dourada:true", '    e(TabelaPlanilha,{cols:cols, linhas:linhas, dourada:true}),', null, "dourada");

console.log("— o que tem que passar");
passa("e(TabelaPlanilha com grade", '    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true}),');
passa("import da TabelaPlanilha", 'import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";');
passa("cabeçalho da tela", '    e(PageHead,{t:"Dívidas", sub:"Fichas e acordos"}),');
passa('botão "Limpar filtros"', '    e("button",{type:"button", className:"h-8 rounded-md px-3 text-[13px]"}, "Limpar filtros"),');
passa("exceção com padrao-ok", '    e(CampoBusca,{value:q}), // padrao-ok: busca de conversas, não é tabela');
passa("CampoBusca dentro de uma peça (components/)", '    e(CampoBusca,{value:q}),', COMP);

console.log("— tela nova");
{
  const sem = R.conferirLinhas(PAG, ['export default function A(){ return null; }'], { arquivoNovo: true, conteudo: 'export default function A(){ return null; }' });
  t("REPROVA: tela nova sem nenhuma peça do padrão", sem.length > 0 && sem[0].indexOf("tabela-planilha.js") >= 0, JSON.stringify(sem));
  const com = R.conferirLinhas(PAG, ['import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";'], { arquivoNovo: true, conteudo: 'import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";\nexport default function A(){ return null; }' });
  t("PASSA:   tela nova que usa a TabelaPlanilha", com.length === 0, JSON.stringify(com));
}

console.log("— as peças de verdade");
for (const [arq] of R.PECAS_TABELA) { const e = R.conferirPecaTabela(arq, fs.readFileSync(path.join(raiz, arq), "utf8")); t("a peça " + arq.split("/").pop() + " está dentro do padrão", e.length === 0, JSON.stringify(e)); }
{
  const arq = "src/apps/montagem/components/tabela-planilha.js", cont = fs.readFileSync(path.join(raiz, arq), "utf8");
  const dourado = cont.replace("var escura = !p.dourada;", "var escura = !!p.escura;");
  t("REPROVA: TabelaPlanilha que volta a ser dourada por padrão", R.conferirPecaTabela(arq, dourado).some((x) => /ESCURO/.test(x)), JSON.stringify(R.conferirPecaTabela(arq, dourado)));
  const semMenu = cont.split("Ordenar de A a Z").join("Ordenar");
  t("REPROVA: TabelaPlanilha que perde o menu de filtro e ordem", R.conferirPecaTabela(arq, semMenu).some((x) => /menu de filtro/.test(x)), JSON.stringify(R.conferirPecaTabela(arq, semMenu)));
}

console.log("— o lembrete que o hook manda a cada mensagem");
t("fala da TabelaPlanilha", /TabelaPlanilha/.test(R.REGRAS));
t("não manda mais topo dourado", !/topo dourado/i.test(R.REGRAS));
t("não manda filtro no topo", !/filtros? no topo/i.test(R.REGRAS.replace(/NUNCA bloco Filtros nem busca no topo/g, "")), R.REGRAS.slice(0, 200));

console.log(falha ? "\n" + falha + " FALHA(S)" : "\nTUDO OK (" + ok + ")");
process.exit(falha ? 1 : 0);
