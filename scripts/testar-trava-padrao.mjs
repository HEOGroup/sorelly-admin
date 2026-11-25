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
const reprova = (nome, linha, arquivo, esperaTexto, op) => { const e = R.conferirLinhas(arquivo || PAG, [linha], op || {}); t("REPROVA: " + nome, e.length > 0 && (!esperaTexto || e.join(" ").indexOf(esperaTexto) >= 0), JSON.stringify(e)); };
const passa = (nome, linha, arquivo, op) => { const e = R.conferirLinhas(arquivo || PAG, [linha], op || {}); t("PASSA:   " + nome, e.length === 0, JSON.stringify(e)); };
const NOVO = { arquivoNovo: true, conteudo: 'import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";' }, HOOK = { aoEditar: true };
const MOB = "src/apps/montagem/mobile/teste.js";

// ───────── PADRÃO DE 25/11/2026 (medido nas telas do Financeiro): texto 10/11 px, título 13 px, controle e linha de 18 a 24 px ─────────
console.log("— tamanho do texto (10 e 11 px; título 13 px)");
passa("texto de 10 px (tabela e controles)", '    e("span",{className:"text-[10px] font-medium text-white"}, x),');
passa("texto de 11 px (Home da família)", '    e("span",{className:"text-[11px] font-semibold"}, x),');
passa("título de 13 px", '    e("h2",{className:"text-[13px] font-bold"}, "Contas a pagar"),');
passa("número de 16 px (tem pista de número)", '    e("b",{className:"text-[16px] tabular-nums"}, brl(v)),');
passa("fontSize de 10 px no estilo", '    e("span",{style:{fontSize:"10px"}}, x),');
reprova("texto de 9 px", '    e("span",{className:"text-[9px]"}, x),', null, "fora do padrão");
reprova("texto de 12 px", '    e("span",{className:"text-[12px]"}, x),', null, "fora do padrão");
reprova("texto de 12.5 px", '    e("span",{className:"text-[12.5px]"}, x),', null, "fora do padrão");
reprova("texto de 14 px que não é número", '    e("p",{className:"text-[14px]"}, "Observação"),', null, "só para NÚMERO");
reprova("texto de 24 px (absurdo)", '    e("b",{className:"text-[24px] tabular-nums"}, brl(v)),', null, "máximo 20 px");
reprova("fontSize de 15 px no estilo", '    e("span",{style:{fontSize:15}}, x),', null, "fontSize solto");
reprova("fonte com clamp", '    e("p",{className:"text-[clamp(11px,1vw,14px)]"}, x),', null, "clamp/vw");
reprova("fonte com vw", '    e("p",{style:{fontSize:"1.2vw"}}, x),', null, "clamp/vw");
reprova("text-sm (14 px com nome)", '    e("p",{className:"text-sm font-semibold"}, x),', null, "tamanho de nome");
reprova("text-xs (12 px com nome)", '    e("p",{className:"px-2 text-xs"}, x),', null, "tamanho de nome");
reprova("text-lg em título", '    e("h2",{className:"font-heading text-lg font-bold"}, "Título"),', null, "tamanho de nome");
reprova("md:text-xl", '    e("h2",{className:"md:text-xl"}, "Título"),', null, "tamanho de nome");
passa("text-sm no app de celular (não é tela do admin)", '    e("p",{className:"text-sm"}, x),', MOB);
passa("classe que só parece tamanho (text-success)", '    e("p",{className:"text-success text-[11px]"}, x),');

console.log("— altura de campo, botão e linha (18 a 24 px)");
passa("botão de 18 px", '    e("button",{type:"button", className:"h-[18px] rounded px-1 text-[10px]"}, "Limpar"),');
passa("seletor de 20 px (h-5)", '    e("select",{className:"h-5 text-[10px]"}, ops),');
passa("campo de 24 px (h-6)", '    e("input",{className:"h-6 w-10 text-[11px]"}),');
passa("linha de 24 px por seletor", '    var LISTA = "[&_table_tbody_td]:!h-[24px] [&_table_tbody_tr]:!h-[24px] [&_table_tbody_td]:!text-[10px]";');
passa("linha de 20 px por seletor", '    var CLS = "[&_table_th]:!h-[20px] [&_table_td]:!text-[11px]";');
passa("fio de 3 px na mesma linha de um botão", '    e("div",{className:"h-[3px] bg-white"}), e("button",{className:"h-[18px] text-[10px]"}, "Ok"),');
passa("caixa de 420 px na mesma linha de um botão", '    e("div",{className:"h-[420px]"}, e("button",{className:"h-6 text-[10px]"}, "Ok")),');
passa("altura mínima do bloco (min-h-6) não é controle", '    e("button",{className:"min-h-6 h-[18px] text-[10px]"}, "Ok"),');
passa("legado: botão de 32 px (h-8) em arquivo que já existia", '    e("button",{type:"button", className:"h-8 rounded-md px-3 text-[13px]"}, "Salvar"),');
passa("legado: cabeçalho de 30 px em arquivo que já existia", '    e("button",{type:"button", className:"h-[30px] px-2 text-[11px]"}, "Coluna"),');
reprova("botão de 28 px (h-7)", '    e("button",{type:"button", className:"h-7 px-2 text-[13px]"}, "Salvar"),', null, "18 a 24 px");
reprova("botão de 28 px (h-[28px])", '    e("button",{type:"button", className:"h-[28px] px-2 text-[11px]"}, "Salvar"),', null, "18 a 24 px");
reprova("botão de 40 px (h-10)", '    e("button",{type:"button", className:"h-10 px-4 text-[13px]"}, "Salvar"),', null, "18 a 24 px");
reprova("campo de 36 px (h-9)", '    e("input",{className:"h-9 text-[13px]"}),', null, "18 a 24 px");
reprova("campo de 12 px (absurdo)", '    e("input",{className:"h-[12px] text-[10px]"}),', null, "18 a 24 px");
reprova("linha de 40 px por seletor", '    var CLS = "[&_table_td]:!h-[40px]";', null, "18 a 24 px");
reprova("linha de 26 px por seletor", '    var CLS = "[&_td]:!h-[26px] [&_td]:!text-[11px]";', null, "18 a 24 px");
reprova("arquivo NOVO com botão de 32 px (h-8)", '    e("button",{type:"button", className:"h-8 rounded-md px-3 text-[13px]"}, "Salvar"),', null, "arquivo novo", NOVO);
reprova("arquivo NOVO com cabeçalho de 30 px", '    e("button",{type:"button", className:"h-[30px] px-2 text-[11px]"}, "Coluna"),', null, "arquivo novo", NOVO);
reprova("arquivo NOVO com altura de 40 px no estilo", '    e("select",{style:{height:"40px"}, className:"text-[10px]"}, ops),', null, "18 a 24 px", NOVO);
passa("arquivo NOVO com altura de 18 px no estilo", '    e("select",{style:{height:"18px"}, className:"text-[10px]"}, ops),', null, NOVO);
passa("arquivo NOVO com botão de 18 px", '    e("button",{type:"button", className:"h-[18px] px-1 text-[10px]"}, "Salvar"),', null, NOVO);
passa('arquivo NOVO: CAMPO.replace("h-8", ...) tira a altura, não é controle de 32 px', '    e("textarea",{rows:3, className:CAMPO.replace("h-8", "py-1.5")}),', null, NOVO);

console.log("— sem caixa alta (20/11/2026)");
{
  const L = '    e("span",{className:"text-[11px] font-semibold uppercase tracking-wide"}, "Total"),';
  reprova("uppercase em tela (sem o arquivo de antes: regra cheia)", L, null, "caixa alta");
  reprova("uppercase em tela nova", L, null, "caixa alta", NOVO);
  reprova("uppercase em peça nova (components/)", L, COMP, "caixa alta", NOVO);
  reprova("md:uppercase", '    e("span",{className:"text-[11px] md:uppercase"}, "Total"),', null, "caixa alta");
  reprova("textTransform no estilo", '    e("span",{style:{textTransform:"uppercase"}}, "Total"),', null, "caixa alta");
  reprova("text-transform dentro de CSS escrito na tela", '    ".cab{font-weight:700;text-transform:uppercase;font-size:11px}"', null, "caixa alta");
  const ANTES = "var a = 1;\n" + L + "\n", MEXIDA = L.replace('"Total"', '"Total geral"');
  passa("legado: linha antiga com uppercase só MEXIDA (a quantidade no arquivo não aumentou)", MEXIDA, null, { antes: ANTES, inteiro: "var a = 2;\n" + MEXIDA + "\n" });
  passa("o mesmo dentro de uma peça (components/), na edição pelo hook", MEXIDA, COMP, { antes: ANTES, inteiro: "var a = 2;\n" + MEXIDA + "\n", aoEditar: true });
  reprova("caixa alta NOVA em arquivo antigo (a quantidade aumentou)", L, null, "caixa alta", { antes: ANTES, inteiro: ANTES + L + "\n" });
  const FF = "src/apps/montagem/pages/FinFamiliar.js", CAB = '  ".ff-cab{background:#2d5190;text-align:center;font-weight:700;text-transform:uppercase;font-size:11px}",';
  passa("legado conhecido da referência: .ff-cab da Home da família (listado na regra e nas pendências)", CAB, FF, { antes: "x\n", inteiro: "x\n" + CAB + "\n", aoEditar: true });
  reprova("outra caixa alta nova na Home da família", L, FF, "caixa alta", { antes: "x\n", inteiro: "x\n" + CAB + "\n" + L + "\n", aoEditar: true });
  passa("desligar a caixa alta na raiz ([&_*]:!normal-case)", '    return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case"},');
  passa("semCaixaAlta:true na tabela", '    e(TabelaPlanilha,{cols:cols, linhas:linhas, fina:true, grade:true, semCaixaAlta:true}),');
  passa("toUpperCase() em dado (busca, código) não é estilo", '    var k = String(v || "").toUpperCase();');
}

console.log("— letras brancas, nunca cinza");
reprova("text-gray-500", '    e("p",{className:"text-[11px] text-gray-500"}, x),', null, "cinza");
reprova("text-muted-foreground (o cinza do tema)", '    e("p",{className:"text-[11px] text-muted-foreground"}, x),', null, "cinza");
reprova("text-white/40", '    e("p",{className:"text-[11px] text-white/40"}, x),', null, "apagado");
passa("text-foreground", '    e("p",{className:"text-[11px] text-foreground"}, x),');
passa("fundo bg-muted não é texto", '    e("div",{className:"bg-muted/40"}, x),');

console.log("— regras que continuam valendo (não afrouxar)");
reprova("faixa de totais", '    e(FaixaTotais,{itens:itens}),', null, "faixa de totais");
reprova("texto cortado (truncate)", '    e("span",{className:"truncate text-[11px]"}, nome),', null, "abreviado");
reprova('reticências com slice + "…"', '    var t = nome.slice(0, 20) + "…";', null, "abreviado");
reprova("célula à direita", '    e("td",{className:"text-right text-[10px]"}, v),', null, "fora do centro");
reprova("chip em forma de pílula", '    e("button",{className:"rounded-full px-3 h-6 text-[11px]"}, "Peito"),', null, "chip");
reprova("degradê na célula", '    e("th",{style:{background:"linear-gradient(90deg,#9A6F1E,#E8B84B)"}}, "A"),', null, "degradê");
reprova("TabelaOuro (dourada) em linha nova", '    e(TabelaOuro,{cols:cols}, linhas),', null, "TabelaPlanilha");
reprova("GradeFiltro em linha nova", '    e(GradeFiltro,{cols:cols, linhas:linhas}),', null, "TabelaPlanilha");

console.log("— import de peça antiga: legado só passa se o arquivo JÁ importava");
{
  const ANTES = 'import { Bloco, BlocoFiltros, Botao, TabelaP } from "@/apps/montagem/components/padrao-fin";\nexport default function A(){ return null; }';
  const linha = 'import { Bloco, BlocoFiltros, Botao, MenuMulti, TabelaP } from "@/apps/montagem/components/padrao-fin";';
  passa("import mexido que só mantém o BlocoFiltros antigo (caso da FinFamiliar.js)", linha, null, { antes: ANTES });
  passa("o mesmo, na edição (hook)", linha, null, { antes: ANTES, aoEditar: true });
  reprova("o mesmo import num arquivo que NÃO importava BlocoFiltros", linha, null, "filtros no topo", { antes: 'import { Bloco } from "@/apps/montagem/components/padrao-fin";' });
  reprova("import que ACRESCENTA outra peça proibida (TabelaCampos)", 'import { BlocoFiltros, TabelaCampos } from "@/apps/montagem/components/padrao-fin";', null, "TabelaPlanilha", { antes: ANTES });
  reprova("USO novo de BlocoFiltros, mesmo com o import antigo", '    e(BlocoFiltros,{a:1}, campos),', null, "filtros no topo", { antes: ANTES });
  reprova("USO novo de TabelaP na edição, mesmo com o import antigo", '    e(TabelaP,{cols:["A"]}, x),', null, "TabelaPlanilha", { antes: ANTES, aoEditar: true });
}

console.log("— exceções (padrao-ok) são contadas");
{
  const c = R.contarExcecoes(['a // padrao-ok: pedido do Marcus em 20/11/2026', 'b // padrao-ok', 'c']);
  t("conta 2 exceções, 1 sem motivo", c.total === 2 && c.semMotivo === 1, JSON.stringify(c));
}

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
  const azul = cont.split("#1c1d21").join("var(--bloco-colunas)").split("1c1d21").join("1F3358");
  t("PASSA:   TabelaPlanilha com o fundo azul do padrão no lugar do #1c1d21 (a trava não impede a peça de nascer certa)", R.conferirPecaTabela(arq, azul).length === 0, JSON.stringify(R.conferirPecaTabela(arq, azul)));
  t("REPROVA: TabelaPlanilha sem fundo escuro nenhum", R.conferirPecaTabela(arq, cont.split("1c1d21").join("ffffff")).some((x) => /fundo escuro/.test(x)));
}

console.log("— as peças que guardam as medidas (planilha-cheia.js e bloco-painel.js)");
{
  const pc = "src/apps/montagem/components/planilha-cheia.js", c1 = fs.readFileSync(path.join(raiz, pc), "utf8");
  const muda = (nome, novo, esperado) => { const er = R.conferirPecaTabela(pc, novo); t("REPROVA: planilha-cheia com " + nome, er.some((x) => x.indexOf(esperado) >= 0), JSON.stringify(er)); };
  muda("letra de 12 px na tabela", c1.split("[&_table_td]:!text-[10px]").join("[&_table_td]:!text-[12px]"), "letra da tabela fina");
  muda("linha de 32 px", c1.split("var(--lh,18px)").join("var(--lh,32px)"), "linha da tabela fina");
  muda("botões da barra de 24 px", c1.split("[&_button]:!h-[18px]").join("[&_button]:!h-[24px]"), "botões da barra");
  muda("seletor CampoMini de 32 px", c1.replace('style:{height:"18px", padding:"0 3px"', 'style:{height:"32px", padding:"0 3px"'), "CampoMini");
  muda("busca BuscaMini de 32 px", c1.replace('style:{height:"18px", padding:"0 4px"}', 'style:{height:"32px", padding:"0 4px"}'), "BuscaMini");
  const bp = "src/apps/montagem/components/bloco-painel.js", c2 = fs.readFileSync(path.join(raiz, bp), "utf8");
  t("REPROVA: bloco-painel sem a linha branca a 30%", R.conferirPecaTabela(bp, c2.split("rgba(255,255,255,0.3)").join("rgba(255,255,255,0.1)")).some((x) => /linha branca/.test(x)));
  t("REPROVA: bloco-painel sem o modo compacto", R.conferirPecaTabela(bp, c2.split("p.compacto ? COMPACTO").join("false ? COMPACTO")).some((x) => /compacto/.test(x)));
}

console.log("— as telas de referência de verdade: a receita delas passa na trava (edição pelo hook)");
{
  // as linhas que montam a tela (página cheia, bloco compacto, barra em forma de tabela, tabela fina) não podem ser reprovadas: se a trava reprova a referência, a regra está errada
  const refs = ["src/apps/montagem/pages/ContasPagarLista.js", "src/apps/montagem/pages/ContasReceberLista.js", "src/apps/montagem/pages/FinFamiliar.js", "src/apps/montagem/pages/pf/Negociacoes.js", "src/apps/montagem/pages/pf/NegAbas.js"];
  const receita = /e\(Pagina,\{className:PAGINA_CHEIA|e\(BlocoPainel,\{titulo[^}]*compacto:true|e\(BarraTabela|e\(CelulaBarra|className:CLS_FINA|fina:true/;
  for (const arq of refs) {
    const cont = fs.readFileSync(path.join(raiz, arq), "utf8"), linhas = cont.split("\n").filter((l) => receita.test(l));
    const er = R.conferirLinhas(arq, linhas, { aoEditar: true, antes: cont, conteudo: cont, inteiro: cont });
    t("PASSA:   " + arq.split("/").pop() + " (" + linhas.length + " linhas da receita)", er.length === 0, JSON.stringify(er.slice(0, 3)));
  }
}

console.log("— tela travada: Visão geral das compras (blocos alinhados, mesma altura)");
{
  const arq = "src/apps/montagem/pages/compras/VisaoCompras.js", cont = fs.readFileSync(path.join(raiz, arq), "utf8");
  t("PASSA:   a Visão geral das compras de verdade", R.conferirTelaTravada(arq, cont).length === 0, JSON.stringify(R.conferirTelaTravada(arq, cont)));
  t("ignora outro arquivo", R.conferirTelaTravada("src/apps/montagem/pages/Outra.js", "e(BlocoPainel,{}); e(BlocoPainel,{});").length === 0);
  const falha = (nome, novo, esperado) => { const er = R.conferirTelaTravada(arq, novo); t("REPROVA: " + nome, er.some((x) => x.indexOf(esperado) >= 0), JSON.stringify(er)); };
  falha("bloco fora do componente Bloco", cont + "\nvar extra = e(BlocoPainel,{titulo:'x'});", "componente Bloco");
  falha("Bloco sem a constante FAIXA", cont.replace("[&>section]:flex-1", "[&>section]:min-w-0"), "FAIXA");
  falha("tabela do Bloco deixou de ser cheia", cont.replace("cheia:p.cheia!==false", "cheia:false"), "cheia por padrão");
  falha("grade com items-start", cont.replace('"grid grid-cols-1 gap-2 lg:grid-cols-2"', '"grid grid-cols-1 items-start gap-2 lg:grid-cols-2"'), "alturas diferentes");
  falha("divisão desigual de colunas", cont.replace('"grid grid-cols-1 gap-2 lg:grid-cols-2"', '"grid grid-cols-1 gap-2 lg:grid-cols-[2fr_1fr]"'), "divisão de coluna desigual");
  falha("tabela feita à mão", cont + '\nvar t = e("table", null);', "feita à mão");
  falha("faixa de números", cont + "\nvar f = e(Faixa, null);", "faixa de números");
  const pl = "src/apps/montagem/components/tabela-planilha.js", cp = fs.readFileSync(path.join(raiz, pl), "utf8");
  t("REPROVA: TabelaPlanilha cheia que volta a encolher (sobra preta embaixo)", R.conferirPecaTabela(pl, cp.replace('(p.cheia ? " min-h-0 flex-1" : "")', '""')).some((x) => /sobra espaço preto/.test(x)));
}

console.log("— tela travada: Configurações de compras (mesma grade de faixas)");
{
  const arq = "src/apps/montagem/pages/compras/CompraConfig.js", cont = fs.readFileSync(path.join(raiz, arq), "utf8");
  t("PASSA:   a Configurações de compras de verdade", R.conferirTelaTravada(arq, cont).length === 0, JSON.stringify(R.conferirTelaTravada(arq, cont)));
  const falha = (nome, novo, esperado) => { const er = R.conferirTelaTravada(arq, novo); t("REPROVA: Configurações com " + nome, er.some((x) => x.indexOf(esperado) >= 0 && x.indexOf("Configurações de compras") === 0), JSON.stringify(er)); };
  falha("bloco fora do componente Bloco", cont + "\nvar extra = e(BlocoPainel,{titulo:'x'});", "componente Bloco");
  falha("Bloco sem a constante FAIXA", cont.replace("[&>section]:flex-1", "[&>section]:min-w-0"), "FAIXA");
  falha("grade com items-start", cont.replace('"grid grid-cols-1 gap-2 lg:grid-cols-2"', '"grid grid-cols-1 items-start gap-2 lg:grid-cols-2"'), "alturas diferentes");
  falha("divisão desigual de colunas", cont.replace('"grid grid-cols-1 gap-2 lg:grid-cols-2"', '"grid grid-cols-1 gap-2 lg:grid-cols-[2fr_1fr]"'), "divisão de coluna desigual");
  falha("tabela feita à mão", cont + '\nvar t = e("table", null);', "feita à mão");
}

console.log("— trava do navegador (25/11/2026: sempre no banco)");
{ const nav = (f, l) => R.conferirNavegador(f, [l]);
  t("REPROVA: localStorage.setItem num domínio", nav("src/apps/montagem/domain/aulas.js", 'localStorage.setItem("x", "1");').length===1);
  t("REPROVA: sessionStorage.setItem numa tela", nav("src/apps/montagem/pages/X.js", 'try{ sessionStorage.setItem("y", v); }catch(x){}').length===1);
  t("REPROVA: indexedDB.open", nav("src/apps/montagem/lib/arquivos.js", 'var r = indexedDB.open("sorelly", 1);').length===1);
  t("REPROVA: window.localStorage[...] =", nav("src/apps/montagem/lib/z.js", 'window.localStorage["k"] = v;').length===1);
  t("REPROVA mesmo com padrao-ok", nav("src/apps/montagem/lib/z.js", 'localStorage.setItem("k", v); // padrao-ok').length===1);
  t("PASSA: ler do navegador (getItem) e apagar (removeItem)", !nav("src/apps/montagem/lib/z.js", 'var v = localStorage.getItem("k"); localStorage.removeItem("k");').length);
  t("PASSA: chave de login em lib/api.js", !nav("src/apps/montagem/lib/api.js", 'localStorage.setItem(CHAVE_TOKEN, t);').length);
  t("PASSA: comentário", !nav("src/apps/montagem/lib/z.js", '// localStorage.setItem("k", v)').length);
  t("PASSA: arquivo fora do src", !nav("scripts/x.mjs", 'localStorage.setItem("k", v);').length); }

console.log("— o lembrete que o hook manda a cada mensagem");
t("fala da TabelaPlanilha", /TabelaPlanilha/.test(R.REGRAS));
t("não manda mais topo dourado", !/topo dourado/i.test(R.REGRAS));
t("não manda filtro no topo", !/filtros? no topo/i.test(R.REGRAS.replace(/NUNCA bloco Filtros nem busca no topo/g, "")), R.REGRAS.slice(0, 200));
t("fala das medidas novas (10 px e 18 px)", /10 px/.test(R.REGRAS) && /18 px/.test(R.REGRAS));
t("não manda mais 32 px, h-8 nem corpo de 13 px", !/32 px|h-8|corpo 13/i.test(R.REGRAS), R.REGRAS.slice(0, 200));
t("traz a receita da tela nova (PAGINA_CHEIA, BlocoPainel compacto, BarraTabela, CLS_FINA_ESPACO, fina:true)", /PAGINA_CHEIA/.test(R.REGRAS) && /compacto:true/.test(R.REGRAS) && /BarraTabela/.test(R.REGRAS) && /CLS_FINA_ESPACO/.test(R.REGRAS) && /fina:true/.test(R.REGRAS));
t("manda sem caixa alta", /sem caixa alta/i.test(R.REGRAS));

console.log(falha ? "\n" + falha + " FALHA(S)" : "\nTUDO OK (" + ok + ")");
process.exit(falha ? 1 : 0);
